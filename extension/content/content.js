(function () {
  let isExtensionEnabled = true;
  let activeOverlayCard = null;
  let cachedReputationData = {};
  const scannedAddresses = new Set();

  const ADDRESS_REGEX = /(0x[a-fA-F0-9]{40}|bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})/g;

  // Initialize
  init();

  function init() {
    // Query background for extension status
    try {
      chrome.runtime.sendMessage({ action: 'GET_REPUTEX_STATE' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          isExtensionEnabled = response.enabled !== false;
          if (isExtensionEnabled) {
            scanDOM();
          }
        }
      });
    } catch (e) {
      console.warn('[ReputeX Content Script] Init notice:', e);
    }

    // Listen for messages from Popup UI
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'REPUTEX_STATE_CHANGED') {
        isExtensionEnabled = msg.enabled;
        if (!isExtensionEnabled) {
          removeAllBadges();
          hideOverlayCard();
        } else {
          scanDOM();
        }
        sendResponse({ success: true });
      } else if (msg.action === 'SCAN_PAGE_WALLETS' || msg.action === 'GET_DETECTED_PAGE_WALLETS') {
        const foundWallets = scanDOM();
        sendResponse({
          wallets: foundWallets,
          reports: cachedReputationData
        });
      }
      return true; // Keep channel open for async response
    });

    // Observe dynamic DOM changes (e.g. infinite scroll, single page apps)
    const observer = new MutationObserver(debounce(() => {
      if (isExtensionEnabled) {
        scanDOM();
      }
    }, 400));

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      scanDOM();
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function scanDOM() {
    if (!isExtensionEnabled || !document.body) return Array.from(scannedAddresses);

    const textNodes = [];
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();

          if (
            tag === 'script' ||
            tag === 'style' ||
            tag === 'textarea' ||
            tag === 'input' ||
            tag === 'select' ||
            tag === 'noscript' ||
            tag === 'iframe' ||
            parent.isContentEditable ||
            parent.closest('.reputex-address-wrapper') ||
            parent.closest('#reputex-overlay-card') ||
            node.nodeValue.trim().length < 25
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          ADDRESS_REGEX.lastIndex = 0;
          if (ADDRESS_REGEX.test(node.nodeValue)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let currentNode;
    while ((currentNode = walk.nextNode())) {
      textNodes.push(currentNode);
    }

    textNodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('.reputex-address-wrapper')) return;

      const text = node.nodeValue;
      ADDRESS_REGEX.lastIndex = 0;
      let match;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let hasMatch = false;

      while ((match = ADDRESS_REGEX.exec(text)) !== null) {
        const address = match[0];
        
        // Skip invalid EVM lengths
        if (address.startsWith('0x') && address.length !== 42) continue;

        hasMatch = true;
        scannedAddresses.add(address);

        // Append text prior to match
        const priorText = text.substring(lastIndex, match.index);
        if (priorText) {
          fragment.appendChild(document.createTextNode(priorText));
        }

        // Create address wrapper span with highlighted address text and inline ReputeX badge
        const wrapper = document.createElement('span');
        wrapper.className = 'reputex-address-wrapper';

        const addrSpan = document.createElement('span');
        addrSpan.className = 'reputex-raw-address';
        addrSpan.textContent = address;
        addrSpan.title = 'Click to inspect score in ReputeX extension';

        const badge = document.createElement('span');
        badge.className = 'reputex-inline-badge reputex-badge-loading';
        badge.setAttribute('data-address', address);
        badge.innerHTML = `⚡ ReputeX`;

        // Click handler: Selects address and requests score
        const clickHandler = (e) => {
          e.stopPropagation();
          e.preventDefault();
          selectAndFetchScore(address, badge);
        };

        addrSpan.addEventListener('click', clickHandler);
        badge.addEventListener('click', clickHandler);

        wrapper.appendChild(addrSpan);
        wrapper.appendChild(badge);
        fragment.appendChild(wrapper);

        lastIndex = ADDRESS_REGEX.lastIndex;
      }

      if (hasMatch) {
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        if (parent && parent.parentNode) {
          parent.replaceChild(fragment, node);
        }
      }
    });

    const addressList = Array.from(scannedAddresses);
    chrome.storage.local.set({ reputex_page_wallets: addressList });
    return addressList;
  }

  function selectAndFetchScore(address, badgeElement) {
    chrome.storage.local.set({ reputex_selected_wallet: address });

    if (cachedReputationData[address]) {
      toggleOverlayCard(badgeElement, address);
      return;
    }

    badgeElement.className = 'reputex-inline-badge reputex-badge-loading';
    badgeElement.innerHTML = `⏳ Analyzing...`;

    chrome.runtime.sendMessage({ action: 'ANALYZE_ADDRESS', address: address }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res && res.data) {
        cachedReputationData[address] = res.data;
        updateSingleBadge(badgeElement, res.data);
        showOverlayCard(badgeElement, address);
      }
    });
  }

  function updateSingleBadge(badge, data) {
    badge.classList.remove('reputex-badge-loading');
    if (data.riskLevel === 'TRUSTED') {
      badge.className = 'reputex-inline-badge reputex-badge-trusted';
      badge.innerHTML = `🛡️ ${data.score} Safe`;
    } else if (data.riskLevel === 'CAUTION') {
      badge.className = 'reputex-inline-badge reputex-badge-caution';
      badge.innerHTML = `⚠️ ${data.score} Caution`;
    } else {
      badge.className = 'reputex-inline-badge reputex-badge-high-risk';
      badge.innerHTML = `🚨 ${data.score} Risk`;
    }
  }

  function removeAllBadges() {
    const wrappers = document.querySelectorAll('.reputex-address-wrapper');
    wrappers.forEach((wrapper) => {
      const rawAddr = wrapper.querySelector('.reputex-raw-address');
      if (rawAddr && wrapper.parentNode) {
        wrapper.parentNode.replaceChild(document.createTextNode(rawAddr.textContent), wrapper);
      }
    });
  }

  function toggleOverlayCard(badgeElement, address) {
    if (activeOverlayCard && activeOverlayCard.getAttribute('data-active-address') === address && activeOverlayCard.classList.contains('reputex-card-visible')) {
      hideOverlayCard();
    } else {
      showOverlayCard(badgeElement, address);
    }
  }

  function showOverlayCard(badgeElement, address) {
    const data = cachedReputationData[address];
    if (!data) return;

    createOrGetOverlayCard();
    const card = activeOverlayCard;
    card.setAttribute('data-active-address', address);

    const shortAddr = address.length > 20 ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}` : address;
    const ensTagHtml = data.ens ? `<span class="reputex-ens-tag">🏷️ ${data.ens}</span>` : '';
    const riskClass = data.riskLevel.toLowerCase();

    let posHtml = '';
    if (data.explanation && data.explanation.positiveFactors && data.explanation.positiveFactors.length > 0) {
      posHtml = data.explanation.positiveFactors
        .map(
          (f) => `
        <div class="reputex-factor-item reputex-factor-pos">
          <div class="reputex-factor-icon">✅</div>
          <div>
            <div class="reputex-factor-head">${f.title}</div>
            <div class="reputex-factor-desc">${f.description}</div>
          </div>
        </div>`
        )
        .join('');
    } else {
      posHtml = `<div style="font-size:11px; color:#64748b; font-style:italic;">No strong positive trust factors.</div>`;
    }

    let negHtml = '';
    if (data.explanation && data.explanation.negativeFactors && data.explanation.negativeFactors.length > 0) {
      negHtml = data.explanation.negativeFactors
        .map(
          (f) => `
        <div class="reputex-factor-item reputex-factor-neg">
          <div class="reputex-factor-icon">🚨</div>
          <div>
            <div class="reputex-factor-head">${f.title}</div>
            <div class="reputex-factor-desc">${f.description}</div>
          </div>
        </div>`
        )
        .join('');
    } else {
      negHtml = `<div style="font-size:11px; color:#64748b; font-style:italic;">No negative risk factors detected.</div>`;
    }

    card.innerHTML = `
      <div class="reputex-card-header">
        <div class="reputex-card-brand">
          <span>⚡ ReputeX XAI Assessment</span>
        </div>
        <button class="reputex-card-close" id="reputex-card-close-btn">&times;</button>
      </div>

      <div class="reputex-score-row">
        <div class="reputex-score-dial ${riskClass}">
          ${data.score}
        </div>
        <div class="reputex-score-info">
          <div style="font-size: 11px; font-weight:700; color: ${
            data.riskLevel === 'TRUSTED' ? '#34d399' : data.riskLevel === 'CAUTION' ? '#facc15' : '#f87171'
          }; text-transform:uppercase; letter-spacing:0.5px;">
            ${data.riskLevel.replace('_', ' ')}
          </div>
          <div class="reputex-addr-title">${shortAddr}</div>
          ${ensTagHtml}
        </div>
      </div>

      <div class="reputex-metrics-grid">
        <div class="reputex-metric-item">
          <div class="reputex-metric-label">Wallet Age</div>
          <div class="reputex-metric-val">${data.metrics.walletAgeDays} Days</div>
        </div>
        <div class="reputex-metric-item">
          <div class="reputex-metric-label">Tx Count</div>
          <div class="reputex-metric-val">${data.metrics.totalTxCount} Txs</div>
        </div>
        <div class="reputex-metric-item">
          <div class="reputex-metric-label">Scam Reports</div>
          <div class="reputex-metric-val" style="color: ${data.metrics.scamReportCount > 0 ? '#f87171' : '#34d399'}">
            ${data.metrics.scamReportCount} Reports
          </div>
        </div>
        <div class="reputex-metric-item">
          <div class="reputex-metric-label">Graph Risk</div>
          <div class="reputex-metric-val">${data.metrics.maliciousProximityScore}/100</div>
        </div>
      </div>

      <div class="reputex-xai-section">
        <div class="reputex-xai-title">Positive Trust Signals</div>
        <div class="reputex-factor-list" style="margin-bottom:10px;">
          ${posHtml}
        </div>

        <div class="reputex-xai-title">Risk & Threat Factors</div>
        <div class="reputex-factor-list">
          ${negHtml}
        </div>
      </div>

      ${data.explanation && data.explanation.aiSynthesis ? `
      <div class="reputex-ai-box">
        <div class="reputex-ai-title">🤖 Nemotron AI Synthesis</div>
        <div class="reputex-ai-summary">${data.explanation.aiSynthesis.summary}</div>
        <div class="reputex-ai-rec">💡 <strong>AI Recommendation:</strong> ${data.explanation.aiSynthesis.recommendation}</div>
      </div>
      ` : ''}

      <div class="reputex-card-footer">
        <span>Confidence Score: ${(data.confidenceScore * 100).toFixed(0)}%</span>
        <span>Nemotron AI Engine</span>
      </div>
    `;

    document.getElementById('reputex-card-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlayCard();
    });

    const rect = badgeElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 8;
    let left = rect.left + scrollLeft;

    if (rect.left + 360 > window.innerWidth) {
      left = Math.max(10, scrollLeft + window.innerWidth - 380);
    }
    if (rect.bottom + 420 > window.innerHeight && rect.top > 420) {
      top = rect.top + scrollTop - 430;
    }

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    card.classList.add('reputex-card-visible');
  }

  function hideOverlayCard() {
    if (activeOverlayCard) {
      activeOverlayCard.classList.remove('reputex-card-visible');
    }
  }

  function createOrGetOverlayCard() {
    if (!activeOverlayCard) {
      activeOverlayCard = document.createElement('div');
      activeOverlayCard.id = 'reputex-overlay-card';
      document.body.appendChild(activeOverlayCard);

      document.addEventListener('click', (e) => {
        if (
          activeOverlayCard &&
          !activeOverlayCard.contains(e.target) &&
          !e.target.classList.contains('reputex-inline-badge') &&
          !e.target.classList.contains('reputex-raw-address')
        ) {
          hideOverlayCard();
        }
      });
    }
    return activeOverlayCard;
  }
})();
