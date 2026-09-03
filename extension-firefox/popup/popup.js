/**
 * ReputeX Extension Popup Controller - CSP & XSS Safe
 * Multi-chain risk scoring, tab navigation, 6-metric grid, community reporting, & history
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
  const chainBadge = document.getElementById('popup-chain-badge');
  const fullAddr = document.getElementById('popup-full-addr');
  const ensTag = document.getElementById('popup-ens-tag');

  const classificationBars = document.getElementById('classification-bars');

  const miniAge = document.getElementById('mini-age');
  const miniTxs = document.getElementById('mini-txs');
  const miniBalance = document.getElementById('mini-balance');
  const miniVolume = document.getElementById('mini-volume');
  const miniReports = document.getElementById('mini-reports');
  const miniGraph = document.getElementById('mini-graph');

  const contractContainer = document.getElementById('contract-status-container');
  const contractPill = document.getElementById('contract-status-pill');
  const factorList = document.getElementById('popup-factor-list');

  // Tabs
  const tabButtons = document.querySelectorAll('.result-tab');
  const tabPanes = {
    score: document.getElementById('pane-score'),
    details: document.getElementById('pane-details'),
    chat: document.getElementById('pane-chat'),
    history: document.getElementById('pane-history')
  };

  // Report Modal
  const openReportBtn = document.getElementById('open-report-btn');
  const reportModalBox = document.getElementById('report-modal-box');
  const closeReportBtn = document.getElementById('close-report-btn');
  const reportCategory = document.getElementById('report-category');
  const reportDesc = document.getElementById('report-desc');
  const submitReportBtn = document.getElementById('submit-report-btn');
  const reportFeedback = document.getElementById('report-feedback');

  // Chat
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatResponseBox = document.getElementById('chat-response-box');
  const chatPresetChips = document.querySelectorAll('.chat-preset-chip');

  // History
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  let activeReportsMap = {};
  let detectedWallets = [];
  let currentActiveAddress = null;
  let currentActiveReportData = null;

  // Initialize toggle state
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

  // Tab switching logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(tabPanes).forEach(paneKey => {
        if (paneKey === tabName) {
          tabPanes[paneKey].classList.remove('hidden');
        } else {
          tabPanes[paneKey].classList.add('hidden');
        }
      });

      if (tabName === 'history') {
        loadAndRenderHistory();
      }
    });
  });

  // Report Modal Open/Close
  if (openReportBtn) {
    openReportBtn.addEventListener('click', () => {
      reportModalBox.classList.toggle('hidden');
      reportFeedback.className = 'report-feedback hidden';
      reportFeedback.textContent = '';
      if (!reportModalBox.classList.contains('hidden')) {
        // switch to details tab where the report modal lives
        tabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'details'));
        Object.keys(tabPanes).forEach(k => tabPanes[k].classList.toggle('hidden', k !== 'details'));
      }
    });
  }

  if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => {
      reportModalBox.classList.add('hidden');
    });
  }

  if (submitReportBtn) {
    submitReportBtn.addEventListener('click', () => {
      if (!currentActiveAddress) {
        alert('Please scan an address before submitting a report.');
        return;
      }
      const category = reportCategory.value;
      const description = reportDesc.value.trim();
      const chain = currentActiveReportData?.chain || 'ethereum';

      submitReportBtn.disabled = true;
      submitReportBtn.textContent = 'Submitting...';

      chrome.runtime.sendMessage({
        action: 'SUBMIT_THREAT_REPORT',
        address: currentActiveAddress,
        chain,
        category,
        description
      }, (res) => {
        submitReportBtn.disabled = false;
        submitReportBtn.textContent = 'Submit Report to Supabase DB';

        if (res && res.success) {
          reportFeedback.className = 'report-feedback success';
          reportFeedback.textContent = '✅ Report submitted successfully to Supabase DB!';
          reportDesc.value = '';
          // Re-scan address after a brief delay to reflect updated community reports
          setTimeout(() => {
            performManualScan(currentActiveAddress);
          }, 1200);
        } else {
          reportFeedback.className = 'report-feedback error';
          reportFeedback.textContent = '❌ Failed to submit: ' + (res?.error || 'Network error');
        }
      });
    });
  }

  // Scan Active Tab
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
    if (/^(addr1[a-z0-9]{50,100}|addr_test1[a-z0-9]{50,100})$/i.test(clean)) return true;
    if (/^[15][a-km-zA-HJ-NP-Z1-9]{46,47}$/.test(clean)) return true;
    if (/^r[0-9a-zA-Z]{24,34}$/.test(clean)) return true;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) return true;
    if (/^[a-zA-Z0-9-]+\.(eth|org|io|crypto|wallet|dao)$/i.test(clean)) return true;
    return false;
  }

  function renderDetectedWallets(wallets, reports, selectedAddr = null) {
    detectedWalletList.textContent = '';

    if (!wallets || wallets.length === 0) {
      pageWalletCount.textContent = '0 found';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-wallets-msg';
      emptyMsg.textContent = 'No blockchain addresses found on this page.';
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

      const addrSpan = document.createElement('span');
      addrSpan.className = 'd-addr';
      addrSpan.textContent = addr.length > 16 ? `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}` : addr;

      const badgeSpan = document.createElement('span');
      const rep = reports[addr.toLowerCase()];

      if (rep && rep.score !== undefined) {
        badgeSpan.className = `d-badge ${rep.riskLevel ? rep.riskLevel.toLowerCase() : 'trusted'}`;
        badgeSpan.textContent = `${rep.score} ${rep.riskCategory || 'Risk'}`;
      } else {
        badgeSpan.className = 'd-badge';
        badgeSpan.style.background = 'rgba(255, 255, 255, 0.08)';
        badgeSpan.style.color = '#94a3b8';
        badgeSpan.textContent = 'Click to Check';
      }

      item.appendChild(addrSpan);
      item.appendChild(badgeSpan);

      item.addEventListener('click', () => {
        document.querySelectorAll('.detected-wallet-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        performManualScan(addr);
      });

      detectedWalletList.appendChild(item);
    });

    if (selectedAddr && wallets.some(w => w.toLowerCase() === selectedAddr.toLowerCase())) {
      performManualScan(selectedAddr);
    } else if (wallets.length > 0 && !currentActiveAddress) {
      performManualScan(wallets[0]);
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
      alert('Please enter a valid EVM, Bitcoin, Solana, Cardano, Polkadot, or XRP address.');
      return;
    }

    currentActiveAddress = address;
    loader.style.display = 'block';
    resultCard.classList.add('hidden');
    chatResponseBox.classList.add('hidden');
    reportModalBox.classList.add('hidden');

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
        saveScanToHistory(response.data);
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

    // Chain Badge
    const chainName = data.chain || (data.address.startsWith('0x') ? 'ethereum' : 'bitcoin');
    chainBadge.textContent = getChainShortLabel(chainName);
    chainBadge.className = `chain-badge ${chainName.toLowerCase()}`;

    const shortAddr = data.address.length > 20 ? `${data.address.substring(0, 8)}...${data.address.substring(data.address.length - 6)}` : data.address;
    fullAddr.textContent = shortAddr;
    ensTag.textContent = data.ens ? `🏷️ ${data.ens}` : (data.metrics.verifiedLabel ? `🏷️ ${data.metrics.verifiedLabel}` : '');

    renderClassificationBars(data.classification || [
      { type: "Personal wallet", pct: 60 },
      { type: "Exchange", pct: 25 },
      { type: "Merchant", pct: 10 },
      { type: "Other", pct: 5 }
    ]);

    // 6 Metrics
    miniAge.textContent = `${data.metrics.walletAgeDays} d`;
    miniTxs.textContent = `${data.metrics.totalTxCount}`;
    miniBalance.textContent = data.currentBalance || data.metrics.currentBalance || (data.metrics.currentBalanceETH ? `${data.metrics.currentBalanceETH} ETH` : '--');
    miniVolume.textContent = data.metrics.totalVolumeUSD ? `$${data.metrics.totalVolumeUSD.toLocaleString()}` : '--';
    miniReports.textContent = `${data.metrics.scamReportCount || 0}`;
    miniReports.style.color = (data.metrics.scamReportCount > 0) ? '#f87171' : '#34d399';
    miniGraph.textContent = `${data.metrics.maliciousProximityScore || 0}/100`;

    // Contract Verification Pill
    if (data.isContract || data.metrics.isContract) {
      contractContainer.classList.remove('hidden');
      if (data.isVerifiedContract || data.metrics.isVerifiedContract) {
        contractPill.className = 'contract-status-pill verified';
        contractPill.textContent = '🛡️ Contract Source Code Verified';
      } else {
        contractPill.className = 'contract-status-pill unverified';
        contractPill.textContent = '🚨 Unverified Contract Code (High Risk)';
      }
    } else {
      contractContainer.classList.add('hidden');
    }

    // Factors List
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

  function getChainShortLabel(chain) {
    switch ((chain || '').toLowerCase()) {
      case 'ethereum': return 'ETH';
      case 'bitcoin': return 'BTC';
      case 'solana': return 'SOL';
      case 'cardano': return 'ADA';
      case 'polkadot': return 'DOT';
      case 'xrp': return 'XRP';
      case 'binance': return 'BSC';
      default: return 'ETH';
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

  // AI Chat Assistant
  chatPresetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      chatInput.value = q;
      sendChatQuestion(q);
    });
  });

  chatSendBtn.addEventListener('click', () => {
    const q = chatInput.value.trim();
    if (q) sendChatQuestion(q);
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const q = chatInput.value.trim();
      if (q) sendChatQuestion(q);
    }
  });

  function sendChatQuestion(question) {
    if (!currentActiveAddress) {
      alert('Please select or scan an address first.');
      return;
    }

    chatSendBtn.disabled = true;
    chatSendBtn.textContent = 'Thinking...';
    chatResponseBox.classList.remove('hidden');
    chatResponseBox.textContent = 'Querying Nemotron AI Web3 security consultant...';

    chrome.runtime.sendMessage({
      action: 'ASK_WALLET_CHAT',
      address: currentActiveAddress,
      question: question,
      context: currentActiveReportData
    }, (res) => {
      chatSendBtn.disabled = false;
      chatSendBtn.textContent = 'Ask';

      if (res && res.answer) {
        chatResponseBox.textContent = res.answer;
      } else {
        chatResponseBox.textContent = 'Unable to get response from AI consultant. Please try again.';
      }
    });
  }

  // History Tracking (chrome.storage.local)
  function saveScanToHistory(report) {
    if (!report || !report.address) return;
    chrome.storage.local.get(['reputex_scan_history'], (stored) => {
      let history = stored.reputex_scan_history || [];
      // Remove existing item if already exists
      history = history.filter(item => item.address.toLowerCase() !== report.address.toLowerCase());
      // Add to front
      history.unshift({
        address: report.address,
        score: report.score,
        riskLevel: report.riskLevel,
        chain: report.chain || 'ethereum',
        timestamp: Date.now()
      });
      // Keep last 25
      if (history.length > 25) history = history.slice(0, 25);
      chrome.storage.local.set({ reputex_scan_history: history });
    });
  }

  function loadAndRenderHistory() {
    chrome.storage.local.get(['reputex_scan_history'], (stored) => {
      const history = stored.reputex_scan_history || [];
      historyList.textContent = '';

      if (history.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'empty-wallets-msg';
        msg.textContent = 'No scan history recorded yet.';
        historyList.appendChild(msg);
        return;
      }

      history.forEach(item => {
        const row = document.createElement('div');
        row.className = 'history-item';

        const addrEl = document.createElement('span');
        addrEl.className = 'history-addr';
        addrEl.textContent = item.address.length > 18 ? `${item.address.substring(0, 8)}...${item.address.substring(item.address.length - 6)}` : item.address;

        const metaEl = document.createElement('div');
        metaEl.className = 'history-meta';

        const chainBadgeEl = document.createElement('span');
        chainBadgeEl.className = `chain-badge ${item.chain || 'ethereum'}`;
        chainBadgeEl.textContent = getChainShortLabel(item.chain);

        const scoreBadge = document.createElement('span');
        scoreBadge.className = `d-badge ${item.riskLevel.toLowerCase()}`;
        scoreBadge.textContent = `${item.score}`;

        metaEl.appendChild(chainBadgeEl);
        metaEl.appendChild(scoreBadge);

        row.appendChild(addrEl);
        row.appendChild(metaEl);

        row.addEventListener('click', () => {
          performManualScan(item.address);
          // switch to score tab
          tabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'score'));
          Object.keys(tabPanes).forEach(k => tabPanes[k].classList.toggle('hidden', k !== 'score'));
        });

        historyList.appendChild(row);
      });
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      chrome.storage.local.set({ reputex_scan_history: [] }, () => {
        loadAndRenderHistory();
      });
    });
  }

});
