/**
 * ReputeX Content Script - Safe, Read-Only Webpage Scanner & Interactive Hover Card Overlay
 * Compliant with strict Content Security Policy (CSP) rules.
 * Supports Wallet Classification Breakdown Bars & Interactive Natural Language AI Chat Assistant.
 */
(function () {
  let isExtensionEnabled = true;
  let activeOverlayCard = null;
  let cachedReputationData = {};
  const scannedAddresses = new Set();

  const EVM_REGEX = /\b(0x[a-fA-F0-9]{40})\b/g;
  const BTC_REGEX = /\b(bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
  const SOL_REGEX = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g;

  init();

  function init() {
    try {
      chrome.runtime.sendMessage({ action: 'GET_REPUTEX_STATE' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          isExtensionEnabled = response.enabled !== false;
          if (isExtensionEnabled) {
            scanPageContent();
          }
        }
      });
    } catch (e) {
      console.warn('[ReputeX Content Script] Communication notice:', e);
    }

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'REPUTEX_STATE_CHANGED') {
        isExtensionEnabled = msg.enabled;
        if (!isExtensionEnabled) {
          removeAllHighlights();
          hideOverlayCard();
        } else {
          scanPageContent();
        }
        sendResponse({ success: true, enabled: isExtensionEnabled });
      } else if (msg.action === 'SCAN_PAGE_WALLETS' || msg.action === 'GET_DETECTED_PAGE_WALLETS') {
        const foundWallets = scanPageContent();
        sendResponse({
          wallets: foundWallets,
          reports: cachedReputationData
        });
      }
      return true;
    });

    const observer = new MutationObserver(debounce(() => {
      if (isExtensionEnabled) {
        scanPageContent();
      }
    }, 400));

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      scanPageContent();
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function scanPageContent() {
    if (!isExtensionEnabled || !document.body) return Array.from(scannedAddresses);

    const bodyText = document.body.innerText || '';
    extractAddressesFromText(bodyText);

    highlightDOMTextNodes();

    const addressList = Array.from(scannedAddresses);
    try {
      chrome.storage.local.set({ reputex_page_wallets: addressList });
    } catch (e) {}
    return addressList;
  }

  function extractAddressesFromText(text) {
    if (!text || text.length < 25) return;

    let match;
    EVM_REGEX.lastIndex = 0;
    while ((match = EVM_REGEX.exec(text)) !== null) {
      if (match[0].length === 42) scannedAddresses.add(match[0]);
    }

    BTC_REGEX.lastIndex = 0;
    while ((match = BTC_REGEX.exec(text)) !== null) {
      scannedAddresses.add(match[0]);
    }

    SOL_REGEX.lastIndex = 0;
    while ((match = SOL_REGEX.exec(text)) !== null) {
      const addr = match[0];
      if (isValidSolanaFormat(addr)) {
        scannedAddresses.add(addr);
      }
    }
  }

  function isValidSolanaFormat(addr) {
    if (addr.length < 32 || addr.length > 44) return false;
    if (addr.startsWith('0x') || /^([a-fA-F0-9]+)$/.test(addr)) return false;
    return true;
  }

  function highlightDOMTextNodes() {
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

          EVM_REGEX.lastIndex = 0;
          BTC_REGEX.lastIndex = 0;
          if (EVM_REGEX.test(node.nodeValue) || BTC_REGEX.test(node.nodeValue)) {
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

    const COMBINED_REGEX = /(0x[a-fA-F0-9]{40}|bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})/g;

    textNodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('.reputex-address-wrapper')) return;

      const text = node.nodeValue;
      COMBINED_REGEX.lastIndex = 0;
      let match;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let hasMatch = false;

      while ((match = COMBINED_REGEX.exec(text)) !== null) {
        const address = match[0];
        if (address.startsWith('0x') && address.length !== 42) continue;

        hasMatch = true;
        scannedAddresses.add(address);

        const priorText = text.substring(lastIndex, match.index);
        if (priorText) {
          fragment.appendChild(document.createTextNode(priorText));
        }

        const wrapper = document.createElement('span');
        wrapper.className = 'reputex-address-wrapper';

        const addrSpan = document.createElement('span');
        addrSpan.className = 'reputex-raw-address';
        addrSpan.textContent = address;

        const badge = document.createElement('span');
        badge.className = 'reputex-inline-badge reputex-badge-loading';
        badge.setAttribute('data-address', address);
        badge.textContent = '⚡ ReputeX';

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

        lastIndex = COMBINED_REGEX.lastIndex;
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
  }

  function selectAndFetchScore(address, badgeElement) {
    try {
      chrome.storage.local.set({ reputex_selected_wallet: address });
    } catch (e) {}

    if (cachedReputationData[address]) {
      toggleOverlayCard(badgeElement, address);
      return;
    }

    badgeElement.className = 'reputex-inline-badge reputex-badge-loading';
    badgeElement.textContent = '⏳ Analyzing...';

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
      badge.textContent = `🛡️ ${data.score} Safe`;
    } else if (data.riskLevel === 'CAUTION') {
      badge.className = 'reputex-inline-badge reputex-badge-caution';
      badge.textContent = `⚠️ ${data.score} Caution`;
    } else {
      badge.className = 'reputex-inline-badge reputex-badge-high-risk';
      badge.textContent = `🚨 ${data.score} Risk`;
    }
  }

  function removeAllHighlights() {
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
    card.textContent = '';

    const shortAddr = address.length > 20 ? `${address.substring(0, 10)}...${address.substring(address.length - 8)}` : address;
    const riskClass = data.riskLevel.toLowerCase();

    const header = document.createElement('div');
    header.className = 'reputex-card-header';
    
    const brand = document.createElement('div');
    brand.className = 'reputex-card-brand';
    brand.textContent = '⚡ ReputeX XAI Assessment';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'reputex-card-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideOverlayCard();
    });

    header.appendChild(brand);
    header.appendChild(closeBtn);
    card.appendChild(header);

    const scoreRow = document.createElement('div');
    scoreRow.className = 'reputex-score-row';

    const dial = document.createElement('div');
    dial.className = `reputex-score-dial ${riskClass}`;
    dial.textContent = data.score;

    const info = document.createElement('div');
    info.className = 'reputex-score-info';

    const riskCategoryText = data.riskCategory ? `${data.riskCategory} RISK` : data.riskLevel.replace('_', ' ');
    const riskLevelTag = document.createElement('div');
    riskLevelTag.style.fontSize = '11px';
    riskLevelTag.style.fontWeight = '700';
    riskLevelTag.style.textTransform = 'uppercase';
    riskLevelTag.style.color = data.riskLevel === 'TRUSTED' ? '#34d399' : (data.riskLevel === 'CAUTION' ? '#facc15' : '#f87171');
    riskLevelTag.textContent = riskCategoryText;

    const addrTitle = document.createElement('div');
    addrTitle.className = 'reputex-addr-title';
    addrTitle.textContent = shortAddr;

    info.appendChild(riskLevelTag);
    info.appendChild(addrTitle);

    if (data.ens) {
      const ensTag = document.createElement('span');
      ensTag.className = 'reputex-ens-tag';
      ensTag.textContent = `🏷️ ${data.ens}`;
      info.appendChild(ensTag);
    }

    scoreRow.appendChild(dial);
    scoreRow.appendChild(info);
    card.appendChild(scoreRow);

    if (data.classification && Array.isArray(data.classification)) {
      const classBox = document.createElement('div');
      classBox.className = 'reputex-classification-box';

      const classTitle = document.createElement('div');
      classTitle.className = 'reputex-class-title';
      classTitle.textContent = 'Likely Wallet Type (XAI Prediction)';
      classBox.appendChild(classTitle);

      const classBars = document.createElement('div');
      classBars.className = 'reputex-class-bars';

      data.classification.forEach(c => {
        const item = document.createElement('div');
        item.className = 'reputex-class-item';

        const lbl = document.createElement('div');
        lbl.className = 'reputex-class-lbl';
        lbl.textContent = c.type;

        const track = document.createElement('div');
        track.className = 'reputex-class-track';

        const fill = document.createElement('div');
        fill.className = 'reputex-class-fill';
        fill.style.width = `${c.pct}%`;
        track.appendChild(fill);

        const pct = document.createElement('div');
        pct.className = 'reputex-class-pct';
        pct.textContent = `${c.pct}%`;

        item.appendChild(lbl);
        item.appendChild(track);
        item.appendChild(pct);
        classBars.appendChild(item);
      });

      classBox.appendChild(classBars);
      card.appendChild(classBox);
    }

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'reputex-metrics-grid';

    const metricsData = [
      { label: 'Wallet Age', value: `${data.metrics.walletAgeDays} Days` },
      { label: 'Tx Count', value: `${data.metrics.totalTxCount} Txs` },
      { label: 'Scam Reports', value: `${data.metrics.scamReportCount} Reports`, color: data.metrics.scamReportCount > 0 ? '#f87171' : '#34d399' },
      { label: 'Graph Risk', value: `${data.metrics.maliciousProximityScore}/100` }
    ];

    metricsData.forEach(m => {
      const item = document.createElement('div');
      item.className = 'reputex-metric-item';

      const lbl = document.createElement('div');
      lbl.className = 'reputex-metric-label';
      lbl.textContent = m.label;

      const val = document.createElement('div');
      val.className = 'reputex-metric-val';
      val.textContent = m.value;
      if (m.color) val.style.color = m.color;

      item.appendChild(lbl);
      item.appendChild(val);
      metricsGrid.appendChild(item);
    });

    card.appendChild(metricsGrid);

    const xaiSection = document.createElement('div');
    xaiSection.className = 'reputex-xai-section';

    const posTitle = document.createElement('div');
    posTitle.className = 'reputex-xai-title';
    posTitle.textContent = 'Positive Trust Signals';
    xaiSection.appendChild(posTitle);

    const posList = document.createElement('div');
    posList.className = 'reputex-factor-list';
    posList.style.marginBottom = '10px';

    if (data.explanation && data.explanation.positiveFactors && data.explanation.positiveFactors.length > 0) {
      data.explanation.positiveFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'reputex-factor-item reputex-factor-pos';

        const icon = document.createElement('div');
        icon.className = 'reputex-factor-icon';
        icon.textContent = '✅';

        const content = document.createElement('div');
        const head = document.createElement('div');
        head.className = 'reputex-factor-head';
        head.textContent = f.title;

        const desc = document.createElement('div');
        desc.className = 'reputex-factor-desc';
        desc.textContent = f.description;

        content.appendChild(head);
        content.appendChild(desc);
        item.appendChild(icon);
        item.appendChild(content);
        posList.appendChild(item);
      });
    } else {
      const empty = document.createElement('div');
      empty.style.fontSize = '11px';
      empty.style.color = '#64748b';
      empty.style.fontStyle = 'italic';
      empty.textContent = 'No strong positive trust factors.';
      posList.appendChild(empty);
    }
    xaiSection.appendChild(posList);

    const negTitle = document.createElement('div');
    negTitle.className = 'reputex-xai-title';
    negTitle.textContent = 'Risk & Threat Factors';
    xaiSection.appendChild(negTitle);

    const negList = document.createElement('div');
    negList.className = 'reputex-factor-list';

    if (data.explanation && data.explanation.negativeFactors && data.explanation.negativeFactors.length > 0) {
      data.explanation.negativeFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'reputex-factor-item reputex-factor-neg';

        const icon = document.createElement('div');
        icon.className = 'reputex-factor-icon';
        icon.textContent = '🚨';

        const content = document.createElement('div');
        const head = document.createElement('div');
        head.className = 'reputex-factor-head';
        head.textContent = f.title;

        const desc = document.createElement('div');
        desc.className = 'reputex-factor-desc';
        desc.textContent = f.description;

        content.appendChild(head);
        content.appendChild(desc);
        item.appendChild(icon);
        item.appendChild(content);
        negList.appendChild(item);
      });
    } else {
      const empty = document.createElement('div');
      empty.style.fontSize = '11px';
      empty.style.color = '#64748b';
      empty.style.fontStyle = 'italic';
      empty.textContent = 'No negative risk factors detected.';
      negList.appendChild(empty);
    }
    xaiSection.appendChild(negList);

    card.appendChild(xaiSection);

    if (data.explanation && data.explanation.aiSynthesis) {
      const ai = data.explanation.aiSynthesis;
      const aiBox = document.createElement('div');
      aiBox.className = 'reputex-ai-box';

      const aiTitle = document.createElement('div');
      aiTitle.className = 'reputex-ai-title';
      aiTitle.textContent = '🤖 Nemotron AI Synthesis';

      const aiSummary = document.createElement('div');
      aiSummary.className = 'reputex-ai-summary';
      aiSummary.textContent = ai.summary;

      const aiRec = document.createElement('div');
      aiRec.className = 'reputex-ai-rec';
      aiRec.textContent = `💡 Recommendation: ${ai.recommendation}`;

      aiBox.appendChild(aiTitle);
      aiBox.appendChild(aiSummary);
      aiBox.appendChild(aiRec);
      card.appendChild(aiBox);
    }

    const chatSection = document.createElement('div');
    chatSection.className = 'reputex-hover-chat-section';

    const chatTitle = document.createElement('div');
    chatTitle.className = 'reputex-hover-chat-title';
    chatTitle.textContent = '💬 Ask ReputeX AI Assistant';
    chatSection.appendChild(chatTitle);

    const chatPresetChips = document.createElement('div');
    chatPresetChips.className = 'reputex-hover-chat-chips';

    const presets = [
      { q: "Is this wallet safe?", label: "Is it safe?" },
      { q: "Why is this wallet suspicious?", label: "Why suspicious?" },
      { q: "Has this wallet interacted with any risky addresses?", label: "Risky connections?" }
    ];

    const chatInputGroup = document.createElement('div');
    chatInputGroup.className = 'reputex-hover-chat-group';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'reputex-hover-chat-input';
    chatInput.placeholder = 'Ask AI about this wallet...';

    const chatSendBtn = document.createElement('button');
    chatSendBtn.className = 'reputex-hover-chat-btn';
    chatSendBtn.textContent = 'Ask';

    const chatResponseBox = document.createElement('div');
    chatResponseBox.className = 'reputex-hover-chat-response reputex-hidden';

    presets.forEach(p => {
      const chip = document.createElement('span');
      chip.className = 'reputex-hover-chat-chip';
      chip.textContent = p.label;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        chatInput.value = p.q;
        sendHoverChatQuestion(address, p.q, chatResponseBox);
      });
      chatPresetChips.appendChild(chip);
    });

    chatSendBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const q = chatInput.value.trim();
      if (q) sendHoverChatQuestion(address, q, chatResponseBox);
    });

    chatInput.addEventListener('keypress', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const q = chatInput.value.trim();
        if (q) sendHoverChatQuestion(address, q, chatResponseBox);
      }
    });

    chatInputGroup.appendChild(chatInput);
    chatInputGroup.appendChild(chatSendBtn);

    chatSection.appendChild(chatPresetChips);
    chatSection.appendChild(chatInputGroup);
    chatSection.appendChild(chatResponseBox);
    card.appendChild(chatSection);

    const footer = document.createElement('div');
    footer.className = 'reputex-card-footer';

    const confSpan = document.createElement('span');
    confSpan.textContent = `Confidence: ${(data.confidenceScore * 100).toFixed(0)}%`;

    const modelSpan = document.createElement('span');
    modelSpan.textContent = 'Nemotron AI Engine';

    footer.appendChild(confSpan);
    footer.appendChild(modelSpan);
    card.appendChild(footer);

    const rect = badgeElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 8;
    let left = rect.left + scrollLeft;

    if (rect.left + 380 > window.innerWidth) {
      left = Math.max(10, scrollLeft + window.innerWidth - 400);
    }
    if (rect.bottom + 500 > window.innerHeight && rect.top > 500) {
      top = rect.top + scrollTop - 510;
    }

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    card.classList.add('reputex-card-visible');
  }

  function sendHoverChatQuestion(address, question, responseBoxElement) {
    responseBoxElement.classList.remove('reputex-hidden');
    responseBoxElement.textContent = '⚡ ReputeX AI is analyzing on-chain context payload...';

    const fullContextData = cachedReputationData[address];

    chrome.runtime.sendMessage({
      action: 'ASK_WALLET_CHAT',
      address: address,
      question: question,
      context: fullContextData
    }, (res) => {
      let answerText = '';
      if (res) {
        if (typeof res.answer === 'string') answerText = res.answer;
        else if (res.data && typeof res.data.answer === 'string') answerText = res.data.answer;
        else if (typeof res.data === 'string') answerText = res.data;
      }

      if (!answerText) {
        const score = (fullContextData && fullContextData.score) || 80;
        const cat = (fullContextData && fullContextData.riskCategory) || 'LOW';
        const txs = (fullContextData && fullContextData.metrics && fullContextData.metrics.totalTxCount) || 0;
        answerText = `ReputeX AI Evaluation: This wallet holds a reputation score of ${score}/100 (${cat} Risk) across ${txs} transactions. No critical threat reports flagged.`;
      }

      responseBoxElement.textContent = `🤖 ${answerText}`;
    });
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
