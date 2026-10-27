/**
 * ReputeX v3 Early Injection Loader
 * Runs at document_start to synchronously inject the provider interceptor
 * before any dApp scripts, web3 libraries, or wallet extensions initialize.
 */
(function () {
  function inject() {
    try {
      if (document.getElementById('reputex-injected-script')) return;
      const target = document.head || document.documentElement;
      if (!target) {
        return requestAnimationFrame(inject);
      }
      const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : ((typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : null);
      if (!runtime || !runtime.getURL) return;

      const s = document.createElement('script');
      s.id = 'reputex-injected-script';
      s.src = runtime.getURL('injected/injected.js');
      s.async = false;
      target.appendChild(s);
    } catch (e) {
      console.warn('[ReputeX Early Injector Notice]:', e);
    }
  }

  inject();
})();
