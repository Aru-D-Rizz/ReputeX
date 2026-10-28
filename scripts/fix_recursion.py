import os

new_wrap_function = '''  const wrappedProviders = new WeakSet();

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
  }'''

for p in ['extension/injected/injected.js', 'extension-firefox/injected/injected.js']:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()
    
    start_str = '  function wrapProvider(provider) {'
    end_str = '  function wrapSolana(solana) {'
    s_idx = text.find(start_str)
    e_idx = text.find(end_str)
    if s_idx != -1 and e_idx != -1:
        text = text[:s_idx] + new_wrap_function + '\n\n' + text[e_idx:]
        with open(p, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'Fixed recursion in {p}')
    else:
        print(f'Markers not found in {p}')
