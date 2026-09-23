/**
 * ReputeX v3 Injected Provider Wrapper Script
 * Runs in main page context (document_start) via web_accessible_resources.
 * Intercepts Web3 provider transaction signing methods to enable pre-sign simulation.
 */
(function () {
  if (window.__REPUTEX_INJECTED__) return;
  window.__REPUTEX_INJECTED__ = true;

  const pendingRequests = new Map();

  // Listen for response messages from ReputeX content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'REPUTEX_CONTENT' || data.type !== 'PRE_SIGN_RESPONSE') return;

    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    pendingRequests.delete(data.requestId);

    if (data.action === 'PROCEED') {
      // User approved -> delegate to original provider call
      pending.executeOriginal();
    } else {
      // User rejected -> fail promise with standard Web3 user rejection error
      const err = new Error('User rejected transaction via ReputeX Pre-Sign Security Overlay.');
      err.code = 4001;
      pending.reject(err);
    }
  });

  function interceptEthereum() {
    if (!window.ethereum || window.ethereum.__REPUTEX_WRAPPED__) return;

    const originalRequest = window.ethereum.request.bind(window.ethereum);

    window.ethereum.request = async function (args) {
      if (!args || !args.method) {
        return originalRequest(args);
      }

      const method = args.method;

      // Intercept transaction signing methods
      if (['eth_sendTransaction', 'eth_signTypedData', 'eth_signTypedData_v4', 'personal_sign'].includes(method)) {
        const requestId = 'reputex_sim_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

        return new Promise((resolve, reject) => {
          pendingRequests.set(requestId, {
            resolve,
            reject,
            executeOriginal: () => {
              originalRequest(args).then(resolve).catch(reject);
            }
          });

          // Send simulation payload to content script
          window.postMessage({
            source: 'REPUTEX_INJECTED',
            type: 'PRE_SIGN_REQUEST',
            requestId,
            method,
            params: args.params || [],
            origin: window.location.origin
          }, '*');
        });
      }

      return originalRequest(args);
    };

    window.ethereum.__REPUTEX_WRAPPED__ = true;
  }

  function interceptSolana() {
    if (!window.solana || window.solana.__REPUTEX_WRAPPED__) return;

    const originalSignAndSend = window.solana.signAndSendTransaction ? window.solana.signAndSendTransaction.bind(window.solana) : null;
    const originalSignTx = window.solana.signTransaction ? window.solana.signTransaction.bind(window.solana) : null;

    if (originalSignAndSend) {
      window.solana.signAndSendTransaction = async function (transaction, options) {
        const requestId = 'reputex_sim_sol_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

        return new Promise((resolve, reject) => {
          pendingRequests.set(requestId, {
            resolve,
            reject,
            executeOriginal: () => {
              originalSignAndSend(transaction, options).then(resolve).catch(reject);
            }
          });

          // Serialize transaction basic info if available
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

    window.solana.__REPUTEX_WRAPPED__ = true;
  }

  // Attempt initial interception
  interceptEthereum();
  interceptSolana();

  // Watch for late wallet injections (e.g. MetaMask injecting window.ethereum asynchronously)
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    interceptEthereum();
    interceptSolana();
    if (attempts > 20) clearInterval(timer);
  }, 300);
})();
