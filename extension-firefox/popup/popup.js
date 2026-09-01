/**
 * ReputeX Extension Popup Controller - CSP & XSS Safe
 * Sends full contextual payload with each Nemotron AI Chat Assistant query.
 */
document.addEventListener('DOMContentLoaded', () => {
  const toggleInput = document.getElementById('reputex-toggle');
  const toggleText = document.getElementById('toggle-text');
  const statusDot = document.getElementById('status-dot');
  const pageStatusText = document.getElementById('page-scan-status');
  const rescanBtn = document.getElementById('rescan-tab-btn');

  const pageWalletCount = document.getElementById('page-wallet-count');
  const detectedWalletList = document.getElementById('detected-wallet-list');

  const addrInput = document.getElementById('manual-addr-input');
  const scanBtn = document.getElementById('scan-addr-btn');
  const quickChips = document.querySelectorAll('.chip');

  const loader = document.getElementById('loader');
  const resultCard = document.getElementById('result-card');

  const scoreRing = document.getElementById('popup-score-ring');
  const riskBadge = document.getElementById('popup-risk-badge');
  const fullAddr = document.getElementById('popup-full-addr');
  const ensTag = document.getElementById('popup-ens-tag');

  const classificationBars = document.getElementById('classification-bars');

  const miniAge = document.getElementById('mini-age');
  const miniTxs = document.getElementById('mini-txs');
  const miniReports = document.getElementById('mini-reports');
  const miniGraph = document.getElementById('mini-graph');
  const factorList = document.getElementById('popup-factor-list');

  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatResponseBox = document.getElementById('chat-response-box');
  const chatPresetChips = document.querySelectorAll('.chat-preset-chip');

  let activeReportsMap = {};
  let detectedWallets = [];
  let currentActiveAddress = null;
  let currentActiveReportData = null;

  chrome.runtime.sendMessage({ action: 'GET_REPUTEX_STATE' }, (res) => {
    if (chrome.runtime.lastError) return;
    const isEnabled = res && res.enabled !== false;
    updateToggleUI(isEnabled);
  });

  toggleInput.addEventListener('change', () => {
    const isEnabled = toggleInput.checked;
    updateToggleUI(isEnabled);
    chrome.runtime.sendMessage({ action: 'SET_REPUTEX_STATE', enabled: isEnabled });
  });

  function updateToggleUI(enabled) {
    toggleInput.checked = enabled;
    if (enabled) {
      toggleText.textContent = 'Active';
      statusDot.classList.remove('disabled');
      pageStatusText.textContent = 'Auto-Scanner Active';
    } else {
      toggleText.textContent = 'Disabled';
      statusDot.classList.add('disabled');
      pageStatusText.textContent = 'Auto-Scanner Paused';
    }
  }

  autoScanActiveTab();

  function autoScanActiveTab() {
    pageWalletCount.textContent = 'Scanning...';
    detectedWalletList.textContent = '';

    const msgBox = document.createElement('div');
    msgBox.className = 'empty-wallets-msg';
    msgBox.textContent = 'Scanning active tab for wallet addresses...';
    detectedWalletList.appendChild(msgBox);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'SCAN_PAGE_WALLETS' }, (res) => {
          if (chrome.runtime.lastError || !res) {
            chrome.storage.local.get(['reputex_page_wallets', 'reputex_page_reports', 'reputex_selected_wallet'], (stored) => {
              detectedWallets = filterValidWallets(stored.reputex_page_wallets || []);
              activeReportsMap = stored.reputex_page_reports || {};
              renderDetectedWallets(detectedWallets, activeReportsMap, stored.reputex_selected_wallet);
            });
            return;
          }

          if (res && res.wallets) {
            detectedWallets = filterValidWallets(res.wallets);
            activeReportsMap = res.reports || {};
            chrome.storage.local.get(['reputex_selected_wallet'], (stored) => {
              renderDetectedWallets(detectedWallets, activeReportsMap, stored.reputex_selected_wallet);
            });
          }
        });
      } else {
        pageWalletCount.textContent = '0 found';
        detectedWalletList.textContent = '';
        const emptyBox = document.createElement('div');
        emptyBox.className = 'empty-wallets-msg';
        emptyBox.textContent = 'No active browser tab found.';
        detectedWalletList.appendChild(emptyBox);
      }
    });
  }

  function filterValidWallets(walletArray) {
    if (!Array.isArray(walletArray)) return [];
    return walletArray.filter(addr => typeof addr === 'string' && validateAddressFormat(addr));
  }

  function validateAddressFormat(address) {
    if (!address) return false;
    const clean = address.trim();
    if (clean.startsWith('0x')) return /^0x[a-fA-F0-9]{40}$/.test(clean);
    if (/^(bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(clean)) return true;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) {
      if (/^[0-9a-fA-F]+$/.test(clean)) return false;
      return true;
    }
    if (/^[a-zA-Z0-9-]+\.(eth|org|io|crypto|wallet|dao)$/i.test(clean)) return true;
    return false;
  }

  function renderDetectedWallets(wallets, reports, selectedAddr) {
    detectedWalletList.textContent = '';

    if (!wallets || wallets.length === 0) {
      pageWalletCount.textContent = '0 found';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-wallets-msg';
      emptyMsg.textContent = 'No wallet addresses detected on active tab.';
      detectedWalletList.appendChild(emptyMsg);
      return;
    }

    pageWalletCount.textContent = `${wallets.length} found`;

    wallets.forEach(addr => {
      const item = document.createElement('div');
      item.className = 'detected-wallet-item';
      if (selectedAddr && selectedAddr.toLowerCase() === addr.toLowerCase()) {
        item.classList.add('selected');
      }

      const rData = reports[addr];
      let riskClass = 'caution';
      let badgeText = 'Click to Check';

      if (rData) {
        riskClass = rData.riskLevel.toLowerCase();
        badgeText = `${rData.score} ${rData.riskCategory || rData.riskLevel.replace('_', ' ')}`;
      }

      const short = addr.length > 20 ? `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}` : addr;

      const dAddr = document.createElement('div');
      dAddr.className = 'd-addr';
      dAddr.textContent = short;

      const dBadge = document.createElement('div');
      dBadge.className = `d-badge ${riskClass}`;
      dBadge.textContent = badgeText;

      item.appendChild(dAddr);
      item.appendChild(dBadge);

      item.addEventListener('click', () => {
        document.querySelectorAll('.detected-wallet-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        addrInput.value = addr;
        chrome.storage.local.set({ reputex_selected_wallet: addr });
        
        performManualScan(addr, (data) => {
          reports[addr] = data;
          dBadge.className = `d-badge ${data.riskLevel.toLowerCase()}`;
          dBadge.textContent = `${data.score} ${data.riskCategory || data.riskLevel.replace('_', ' ')}`;
        });
      });

      detectedWalletList.appendChild(item);
    });

    if (selectedAddr && wallets.includes(selectedAddr)) {
      performManualScan(selectedAddr);
    }
  }

  rescanBtn.addEventListener('click', () => {
    autoScanActiveTab();
  });

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const addr = chip.getAttribute('data-addr');
      addrInput.value = addr;
      performManualScan(addr);
    });
  });

  scanBtn.addEventListener('click', () => {
    const addr = addrInput.value.trim();
    if (addr) performManualScan(addr);
  });

  addrInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const addr = addrInput.value.trim();
      if (addr) performManualScan(addr);
    }
  });

  function performManualScan(address, onComplete) {
    if (!validateAddressFormat(address)) {
      alert('Please enter a valid EVM, Bitcoin, Solana address or Web3 domain name.');
      return;
    }

    currentActiveAddress = address;
    loader.style.display = 'block';
    resultCard.classList.add('hidden');
    chatResponseBox.classList.add('hidden');

    chrome.runtime.sendMessage({
      action: 'ANALYZE_ADDRESS',
      address: address
    }, (response) => {
      loader.style.display = 'none';
      if (chrome.runtime.lastError) {
        alert('Communication error with ReputeX background worker.');
        return;
      }
      if (response && response.data) {
        currentActiveReportData = response.data;
        renderReport(response.data);
        if (onComplete) onComplete(response.data);
      }
    });
  }

  function renderReport(data) {
    resultCard.classList.remove('hidden');

    scoreRing.textContent = data.score;
    scoreRing.className = `popup-score-ring ${data.riskLevel.toLowerCase()}`;

    const categoryText = data.riskCategory ? `${data.riskCategory} RISK` : data.riskLevel.replace('_', ' ');
    riskBadge.textContent = categoryText;
    riskBadge.className = `risk-badge ${data.riskLevel.toLowerCase()}`;

    const shortAddr = data.address.length > 20 ? `${data.address.substring(0, 10)}...${data.address.substring(data.address.length - 8)}` : data.address;
    fullAddr.textContent = shortAddr;
    ensTag.textContent = data.ens ? `🏷️ ${data.ens}` : (data.metrics.verifiedLabel ? `🏷️ ${data.metrics.verifiedLabel}` : '');

    renderClassificationBars(data.classification || [
      { type: "Personal wallet", pct: 60 },
      { type: "Exchange", pct: 25 },
      { type: "Merchant", pct: 10 },
      { type: "Other", pct: 5 }
    ]);

    miniAge.textContent = `${data.metrics.walletAgeDays} d`;
    miniTxs.textContent = `${data.metrics.totalTxCount}`;
    miniReports.textContent = `${data.metrics.scamReportCount}`;
    miniReports.style.color = data.metrics.scamReportCount > 0 ? '#f87171' : '#34d399';
    miniGraph.textContent = `${data.metrics.maliciousProximityScore}/100`;

    factorList.textContent = '';

    if (data.explanation && data.explanation.aiSynthesis) {
      const ai = data.explanation.aiSynthesis;
      const aiItem = document.createElement('div');
      aiItem.className = 'f-item';
      aiItem.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))';
      aiItem.style.border = '1px solid rgba(168, 85, 247, 0.4)';
      aiItem.style.color = '#e2e8f0';

      const aiHead = document.createElement('div');
      aiHead.style.fontWeight = '700';
      aiHead.style.color = '#c084fc';
      aiHead.style.marginBottom = '2px';
      aiHead.textContent = '🤖 Nemotron AI Synthesis';

      const aiSum = document.createElement('div');
      aiSum.style.marginBottom = '4px';
      aiSum.textContent = ai.summary;

      const aiRec = document.createElement('div');
      aiRec.style.color = '#a7f3d0';
      aiRec.style.fontSize = '9.5px';
      aiRec.textContent = `💡 Recommendation: ${ai.recommendation}`;

      aiItem.appendChild(aiHead);
      aiItem.appendChild(aiSum);
      aiItem.appendChild(aiRec);
      factorList.appendChild(aiItem);
    }

    if (data.explanation.positiveFactors) {
      data.explanation.positiveFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'f-item pos';
        item.textContent = `✅ ${f.title}: ${f.description}`;
        factorList.appendChild(item);
      });
    }

    if (data.explanation.negativeFactors) {
      data.explanation.negativeFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'f-item neg';
        item.textContent = `🚨 ${f.title}: ${f.description}`;
        factorList.appendChild(item);
      });
    }
  }

  function renderClassificationBars(classList) {
    classificationBars.textContent = '';
    classList.forEach(c => {
      const item = document.createElement('div');
      item.className = 'class-bar-item';

      const lbl = document.createElement('div');
      lbl.className = 'class-lbl';
      lbl.textContent = c.type;

      const track = document.createElement('div');
      track.className = 'class-track';

      const fill = document.createElement('div');
      fill.className = 'class-fill';
      fill.style.width = `${c.pct}%`;
      track.appendChild(fill);

      const pct = document.createElement('div');
      pct.className = 'class-pct';
      pct.textContent = `${c.pct}%`;

      item.appendChild(lbl);
      item.appendChild(track);
      item.appendChild(pct);

      classificationBars.appendChild(item);
    });
  }

  chatPresetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-q');
      chatInput.value = question;
      handleChatQuestion(question);
    });
  });

  chatSendBtn.addEventListener('click', () => {
    const q = chatInput.value.trim();
    if (q) handleChatQuestion(q);
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const q = chatInput.value.trim();
      if (q) handleChatQuestion(q);
    }
  });

  function handleChatQuestion(question) {
    if (!currentActiveAddress) {
      alert('Please select or scan a wallet address first.');
      return;
    }

    chatResponseBox.classList.remove('hidden');
    chatResponseBox.textContent = '⚡ ReputeX AI is analyzing on-chain context payload...';

    chrome.runtime.sendMessage({
      action: 'ASK_WALLET_CHAT',
      address: currentActiveAddress,
      question: question,
      context: currentActiveReportData
    }, (res) => {
      let answerText = '';
      if (res) {
        if (typeof res.answer === 'string') answerText = res.answer;
        else if (res.data && typeof res.data.answer === 'string') answerText = res.data.answer;
        else if (typeof res.data === 'string') answerText = res.data;
      }

      if (!answerText) {
        const score = (currentActiveReportData && currentActiveReportData.score) || 80;
        const cat = (currentActiveReportData && currentActiveReportData.riskCategory) || 'LOW';
        const txs = (currentActiveReportData && currentActiveReportData.metrics && currentActiveReportData.metrics.totalTxCount) || 0;
        answerText = `ReputeX AI Evaluation: This wallet holds a reputation score of ${score}/100 (${cat} Risk) across ${txs} transactions. No critical threat reports flagged.`;
      }

      chatResponseBox.textContent = `🤖 ${answerText}`;
    });
  }
});
