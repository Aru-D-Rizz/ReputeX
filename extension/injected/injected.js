/**
 * ReputeX v3 Injected Provider Wrapper Script
 * Runs in the main page world at document_start.
 * Intercepts EIP-1193 (.request), legacy Web3 (.sendAsync), ethers.js (.send),
 * and EIP-6963 provider announcements for comprehensive pre-sign transaction simulation.
 */
(function () {
  if (window.__REPUTEX_INJECTED__) return;
  window.__REPUTEX_INJECTED__ = true;

  const INTERCEPTED_METHODS = new Set([
    'eth_sendTransaction',
    'eth_signTransaction',
    'personal_sign',
    'eth_sign',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4'
  ]);

  const pendingRequests = new Map();

  function registerPending(requestId, entry) {
    entry.timeout = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        console.warn('[ReputeX] Pre-sign simulation timed out (25s), auto-proceeding to wallet.');
        pendingRequests.delete(requestId);
        if (typeof entry.onProceed === 'function') entry.onProceed();
      }
    }, 25000);
    registerPending(requestId, entry);
  }

  // Listen for simulation user approval/rejection responses from ReputeX content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'REPUTEX_CONTENT' || data.type !== 'PRE_SIGN_RESPONSE') return;

    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    if (pending.timeout) clearTimeout(pending.timeout);
    pendingRequests.delete(data.requestId);

    if (data.action === 'PROCEED') {
      if (typeof pending.onProceed === 'function') {
        pending.onProceed();
      }
    } else {
      if (typeof pending.onReject === 'function') {
        pending.onReject();
      }
    }
  });

  function createFallbackEthereumProvider() {
    const fallbackAccounts = ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'];
    const p = {
      isMetaMask: true,
      isReputeXFallback: true,
      chainId: '0x1',
      networkVersion: '1',
      selectedAddress: fallbackAccounts[0],
      isConnected: () => true,
      on: function (event, handler) { return p; },
      addListener: function (event, handler) { return p; },
      removeListener: function (event, handler) { return p; },
      enable: async function () { return fallbackAccounts; },
      request: async function (args) {
        if (!args || !args.method) return null;
        const m = args.method;
        if (m === 'eth_accounts' || m === 'eth_requestAccounts') return fallbackAccounts;
        if (m === 'eth_chainId') return '0x1';
        if (m === 'net_version') return '1';
        if (m === 'eth_getBalance') return '0x56bc75e2d63100000'; // 100 ETH
        if (m === 'eth_gasPrice') return '0x4a817c800'; // 20 Gwei
        if (m === 'eth_estimateGas') return '0x5208'; // 21,000 gas
        if (m === 'eth_blockNumber') return '0x13ba4b0';
        if (m === 'eth_getTransactionCount') return '0x1';
        if (m === 'eth_getCode') return '0x';
        if (m === 'wallet_switchEthereumChain') return null;
        return '0x' + Array(64).fill('a').join('');
      },
      sendAsync: function (payload, callback) {
        if (!payload) return;
        if (Array.isArray(payload)) {
          Promise.all(payload.map(item => p.request(item)))
            .then(results => callback && callback(null, results.map((r, i) => ({ id: payload[i].id, jsonrpc: '2.0', result: r }))))
            .catch(err => callback && callback(err));
          return;
        }
        p.request(payload)
          .then(result => callback && callback(null, { id: payload.id, jsonrpc: payload.jsonrpc || '2.0', result }))
          .catch(err => callback && callback(err));
      },
      send: function (a, b) {
        if (typeof b === 'function') return p.sendAsync(a, b);
        if (typeof a === 'string') return p.request({ method: a, params: b || [] });
        if (a && typeof a === 'object') {
          return new Promise((res, rej) => p.sendAsync(a, (err, r) => err ? rej(err) : res(r && r.result)));
        }
        return Promise.resolve(null);
      }
    };
    return p;
  }

  const wrappedProviders = new WeakSet();

  function wrapProvider(provider) {
    if (!provider || typeof provider !== 'object') return provider;
    if (wrappedProviders.has(provider) || provider.__REPUTEX_WRAPPED__) return provider;
    wrappedProviders.add(provider);

    // Handle multi-provider arrays (e.g. window.ethereum.providers)
    if (Array.isArray(provider.providers)) {
      provider.providers.forEach(p => wrapProvider(p));
    }

    const origRequest = typeof provider.request === 'function' ? provider.request.bind(provider) : null;
    const origSendAsync = typeof provider.sendAsync === 'function' ? provider.sendAsync.bind(provider) : null;
    const origSend = typeof provider.send === 'function' ? provider.send.bind(provider) : null;

    // 1. Wrap EIP-1193 standard (.request)
    provider.request = async function (args) {
      if (!args || !INTERCEPTED_METHODS.has(args.method)) {
        if (origRequest) return origRequest(args);
        return null;
      }

      const requestId = 'reputex_sim_' + Date.now() + '_' + Math.floor(Math.random() * 100000);

      return new Promise((resolve, reject) => {
        registerPending(requestId, {
          onProceed: () => {
            if (origRequest) {
              origRequest(args).then(resolve).catch(reject);
            } else {
              resolve('0x' + Array(64).fill('a').join(''));
            }
          },
          onReject: () => {
            const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
            err.code = 4001;
            reject(err);
          }
        });

        window.postMessage({
          source: 'REPUTEX_INJECTED',
          type: 'PRE_SIGN_REQUEST',
          requestId,
          method: args.method,
          params: args.params || [],
          origin: window.location.origin
        }, '*');
      });
    };

    // 2. Wrap legacy Web3.js / ethers.js (.sendAsync) - No recursive call to .send
    provider.sendAsync = function (payload, callback) {
      if (Array.isArray(payload)) {
        const interceptedItem = payload.find(item => item && INTERCEPTED_METHODS.has(item.method));
        if (interceptedItem) {
          const requestId = 'reputex_sim_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
          registerPending(requestId, {
            onProceed: () => {
              if (origSendAsync) {
                origSendAsync(payload, callback);
              } else if (origRequest) {
                Promise.all(payload.map(p => origRequest({ method: p.method, params: p.params })))
                  .then(results => callback && callback(null, results.map((r, i) => ({ id: payload[i].id, jsonrpc: '2.0', result: r }))))
                  .catch(e => callback && callback(e));
              }
            },
            onReject: () => {
              const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
              err.code = 4001;
              if (typeof callback === 'function') {
                callback(err, { id: interceptedItem.id, jsonrpc: '2.0', error: { code: 4001, message: err.message } });
              }
            }
          });

          window.postMessage({
            source: 'REPUTEX_INJECTED',
            type: 'PRE_SIGN_REQUEST',
            requestId,
            method: interceptedItem.method,
            params: interceptedItem.params || [],
            origin: window.location.origin
          }, '*');
          return;
        }

        if (origSendAsync) return origSendAsync(payload, callback);
        if (origRequest) {
          Promise.all(payload.map(p => origRequest({ method: p.method, params: p.params })))
            .then(results => callback && callback(null, results.map((r, i) => ({ id: payload[i].id, jsonrpc: '2.0', result: r }))))
            .catch(e => callback && callback(e));
          return;
        }
      }

      if (payload && INTERCEPTED_METHODS.has(payload.method)) {
        const requestId = 'reputex_sim_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        registerPending(requestId, {
          onProceed: () => {
            if (origSendAsync) {
              origSendAsync(payload, callback);
            } else if (origRequest) {
              origRequest({ method: payload.method, params: payload.params })
                .then(result => callback && callback(null, { id: payload.id, jsonrpc: payload.jsonrpc || '2.0', result }))
                .catch(err => callback && callback(err));
            } else if (typeof callback === 'function') {
              callback(null, { id: payload.id, jsonrpc: '2.0', result: '0x' + Array(64).fill('a').join('') });
            }
          },
          onReject: () => {
            const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
            err.code = 4001;
            if (typeof callback === 'function') {
              callback(err, { id: payload.id, jsonrpc: payload.jsonrpc || '2.0', error: { code: 4001, message: err.message } });
            }
          }
        });

        window.postMessage({
          source: 'REPUTEX_INJECTED',
          type: 'PRE_SIGN_REQUEST',
          requestId,
          method: payload.method,
          params: payload.params || [],
          origin: window.location.origin
        }, '*');
        return;
      }

      if (origSendAsync) {
        return origSendAsync(payload, callback);
      }
      if (origRequest && payload && payload.method) {
        origRequest({ method: payload.method, params: payload.params })
          .then(res => callback && callback(null, { id: payload.id, jsonrpc: '2.0', result: res }))
          .catch(err => callback && callback(err));
        return;
      }
      if (typeof callback === 'function') {
        callback(null, { id: (payload && payload.id) || 1, jsonrpc: '2.0', result: null });
      }
    };

    // 3. Wrap ethers.js / web3 hybrid (.send) - Strictly delegates to origSend without ping-ponging
    provider.send = function (methodOrPayload, callbackOrParams) {
      if (typeof methodOrPayload === 'string' && INTERCEPTED_METHODS.has(methodOrPayload)) {
        return provider.request({ method: methodOrPayload, params: callbackOrParams || [] });
      }
      if (methodOrPayload && typeof methodOrPayload === 'object' && INTERCEPTED_METHODS.has(methodOrPayload.method)) {
        const requestId = 'reputex_sim_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        if (typeof callbackOrParams === 'function') {
          registerPending(requestId, {
            onProceed: () => {
              if (origSend) origSend(methodOrPayload, callbackOrParams);
              else if (origSendAsync) origSendAsync(methodOrPayload, callbackOrParams);
            },
            onReject: () => {
              const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
              err.code = 4001;
              callbackOrParams(err, { id: methodOrPayload.id, jsonrpc: '2.0', error: { code: 4001, message: err.message } });
            }
          });
          window.postMessage({
            source: 'REPUTEX_INJECTED',
            type: 'PRE_SIGN_REQUEST',
            requestId,
            method: methodOrPayload.method,
            params: methodOrPayload.params || [],
            origin: window.location.origin
          }, '*');
          return;
        } else {
          return new Promise((resolve, reject) => {
            registerPending(requestId, {
              onProceed: () => {
                if (origSend) resolve(origSend(methodOrPayload));
                else if (origRequest) origRequest({ method: methodOrPayload.method, params: methodOrPayload.params || [] }).then(resolve).catch(reject);
                else resolve('0x' + Array(64).fill('a').join(''));
              },
              onReject: () => {
                const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
                err.code = 4001;
                reject(err);
              }
            });
            window.postMessage({
              source: 'REPUTEX_INJECTED',
              type: 'PRE_SIGN_REQUEST',
              requestId,
              method: methodOrPayload.method,
              params: methodOrPayload.params || [],
              origin: window.location.origin
            }, '*');
          });
        }
      }

      if (origSend) {
        return origSend(methodOrPayload, callbackOrParams);
      }
      if (origRequest && typeof methodOrPayload === 'string') {
        return origRequest({ method: methodOrPayload, params: callbackOrParams || [] });
      }
      if (origRequest && methodOrPayload && methodOrPayload.method) {
        return origRequest({ method: methodOrPayload.method, params: methodOrPayload.params || [] });
      }
      if (typeof callbackOrParams === 'function') {
        callbackOrParams(null, { id: 1, jsonrpc: '2.0', result: null });
      }
    };

    try {
      Object.defineProperty(provider, '__REPUTEX_WRAPPED__', {
        value: true,
        writable: true,
        configurable: true
      });
    } catch (e) {
      provider.__REPUTEX_WRAPPED__ = true;
    }

    return provider;
  }

  function wrapSolana(solana) {
    if (!solana || solana.__REPUTEX_WRAPPED__) return solana;

    const originalSignAndSend = solana.signAndSendTransaction ? solana.signAndSendTransaction.bind(solana) : null;
    const originalSignTx = solana.signTransaction ? solana.signTransaction.bind(solana) : null;

    if (originalSignAndSend) {
      solana.signAndSendTransaction = async function (transaction, options) {
        const requestId = 'reputex_sim_sol_' + Date.now() + '_' + Math.floor(Math.random() * 100000);

        return new Promise((resolve, reject) => {
          registerPending(requestId, {
            onProceed: () => {
              originalSignAndSend(transaction, options).then(resolve).catch(reject);
            },
            onReject: () => {
              const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
              err.code = 4001;
              reject(err);
            }
          });

          let txData = { chain: 'solana' };
          try {
            if (transaction && transaction.instructions) {
              txData.instructionCount = transaction.instructions.length;
              if (transaction.feePayer) txData.feePayer = transaction.feePayer.toBase58();
            }
          } catch (e) {}

          window.postMessage({
            source: 'REPUTEX_INJECTED',
            type: 'PRE_SIGN_REQUEST',
            requestId,
            method: 'solana_signAndSendTransaction',
            params: [txData],
            origin: window.location.origin
          }, '*');
        });
      };
    }

    try {
      Object.defineProperty(solana, '__REPUTEX_WRAPPED__', {
        value: true,
        writable: true,
        configurable: true
      });
    } catch (e) {
      solana.__REPUTEX_WRAPPED__ = true;
    }

    return solana;
  }

  // Intercept EIP-6963 provider announcements in capture phase before dApps bind
  window.addEventListener('eip6963:announceProvider', (event) => {
    if (event && event.detail && event.detail.provider) {
      wrapProvider(event.detail.provider);
    }
  }, true);

  // Getter & Setter Interception on window.ethereum
  let currentEthereum = window.ethereum;

  if (currentEthereum) {
    wrapProvider(currentEthereum);
  }

  try {
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      enumerable: true,
      get: function () {
        if (!currentEthereum) {
          currentEthereum = createFallbackEthereumProvider();
          wrapProvider(currentEthereum);
        }
        return currentEthereum;
      },
      set: function (newProvider) {
        if (newProvider) {
          wrapProvider(newProvider);
        }
        currentEthereum = newProvider;
      }
    });
  } catch (e) {
    if (window.ethereum) wrapProvider(window.ethereum);
  }

  // Intercept window.solana
  let currentSolana = window.solana;
  if (currentSolana) {
    wrapSolana(currentSolana);
  }

  try {
    Object.defineProperty(window, 'solana', {
      configurable: true,
      enumerable: true,
      get: function () {
        return currentSolana;
      },
      set: function (newSolana) {
        if (newSolana) {
          wrapSolana(newSolana);
        }
        currentSolana = newSolana;
      }
    });
  } catch (e) {
    if (window.solana) wrapSolana(window.solana);
  }

  // Active fast polling to catch late wallet injections or prototype overrides
  let checkCount = 0;
  const pollTimer = setInterval(() => {
    checkCount++;
    if (window.ethereum && !window.ethereum.__REPUTEX_WRAPPED__) {
      wrapProvider(window.ethereum);
    }
    if (window.ethereum && Array.isArray(window.ethereum.providers)) {
      window.ethereum.providers.forEach(p => wrapProvider(p));
    }
    if (window.web3 && window.web3.currentProvider && !window.web3.currentProvider.__REPUTEX_WRAPPED__) {
      wrapProvider(window.web3.currentProvider);
    }
    if (window.solana && !window.solana.__REPUTEX_WRAPPED__) {
      wrapSolana(window.solana);
    }
    if (checkCount > 100) {
      clearInterval(pollTimer);
    }
  }, 100);
})();
