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

  const miniAge = document.getElementById('mini-age');
  const miniTxs = document.getElementById('mini-txs');
  const miniReports = document.getElementById('mini-reports');
  const miniGraph = document.getElementById('mini-graph');
  const factorList = document.getElementById('popup-factor-list');

  let activeReportsMap = {};

  // Load extension active state
  chrome.runtime.sendMessage({ action: 'GET_REPUTEX_STATE' }, (res) => {
    if (chrome.runtime.lastError) return;
    const isEnabled = res && res.enabled !== false;
    updateToggleUI(isEnabled);
  });

  // Handle Toggle Switch
  toggleInput.addEventListener('change', () => {
    const isEnabled = toggleInput.checked;
    updateToggleUI(isEnabled);

    chrome.runtime.sendMessage({
      action: 'SET_REPUTEX_STATE',
      enabled: isEnabled
    });
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

  // Load detected page wallets
  loadDetectedPageWallets();

  function loadDetectedPageWallets() {
    chrome.storage.local.get(['reputex_page_wallets', 'reputex_page_reports', 'reputex_selected_wallet'], (stored) => {
      const wallets = stored.reputex_page_wallets || [];
      const reports = stored.reputex_page_reports || {};
      const selectedAddr = stored.reputex_selected_wallet;

      activeReportsMap = reports;
      renderDetectedWallets(wallets, reports, selectedAddr);

      // Query active tab directly for live dynamic updates
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_DETECTED_PAGE_WALLETS' }, (res) => {
            if (chrome.runtime.lastError) return;
            if (res && res.wallets) {
              activeReportsMap = Object.assign({}, reports, res.reports || {});
              renderDetectedWallets(res.wallets, activeReportsMap, selectedAddr);
            }
          });
        }
      });
    });
  }

  function renderDetectedWallets(wallets, reports, selectedAddr) {
    if (!wallets || wallets.length === 0) {
      pageWalletCount.textContent = '0 found';
      detectedWalletList.innerHTML = `<div class="empty-wallets-msg">No wallet addresses detected on active tab.</div>`;
      return;
    }

    pageWalletCount.textContent = `${wallets.length} found`;
    detectedWalletList.innerHTML = '';

    wallets.forEach(addr => {
      const item = document.createElement('div');
      item.className = 'detected-wallet-item';
      if (selectedAddr && selectedAddr.toLowerCase() === addr.toLowerCase()) {
        item.classList.add('selected');
        performManualScan(addr);
      }

      const rData = reports[addr];
      const riskClass = rData ? rData.riskLevel.toLowerCase() : 'trusted';
      const badgeText = rData ? `${rData.score} ${rData.riskLevel.replace('_', ' ')}` : 'Scanning...';

      const short = `${addr.substring(0, 8)}...${addr.substring(34)}`;
      item.innerHTML = `
        <div class="d-addr">${short}</div>
        <div class="d-badge ${riskClass}">${badgeText}</div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.detected-wallet-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        addrInput.value = addr;
        chrome.storage.local.set({ reputex_selected_wallet: addr });
        performManualScan(addr);
      });

      detectedWalletList.appendChild(item);
    });

    if (!selectedAddr && wallets.length > 0 && resultCard.classList.contains('hidden')) {
      performManualScan(wallets[0]);
    }
  }

  // Handle Rescan Active Tab
  rescanBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'REPUTEX_STATE_CHANGED',
          enabled: toggleInput.checked
        }).catch(() => {});
        setTimeout(loadDetectedPageWallets, 500);
      }
    });
  });

  // Handle Quick Chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const addr = chip.getAttribute('data-addr');
      addrInput.value = addr;
      performManualScan(addr);
    });
  });

  // Handle Manual Scan Button
  scanBtn.addEventListener('click', () => {
    const addr = addrInput.value.trim();
    if (addr) {
      performManualScan(addr);
    }
  });

  // Support Enter key inside input
  addrInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const addr = addrInput.value.trim();
      if (addr) performManualScan(addr);
    }
  });

  function performManualScan(address) {
    loader.style.display = 'block';
    resultCard.classList.add('hidden');

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
        renderReport(response.data);
      }
    });
  }

  function renderReport(data) {
    resultCard.classList.remove('hidden');

    // Score ring
    scoreRing.textContent = data.score;
    scoreRing.className = `popup-score-ring ${data.riskLevel.toLowerCase()}`;

    // Risk badge
    riskBadge.textContent = data.riskLevel.replace('_', ' ');
    riskBadge.className = `risk-badge ${data.riskLevel.toLowerCase()}`;

    // Address & ENS
    const shortAddr = `${data.address.substring(0, 10)}...${data.address.substring(34)}`;
    fullAddr.textContent = shortAddr;
    ensTag.textContent = data.ens ? `🏷️ ${data.ens}` : (data.metrics.verifiedLabel ? `🏷️ ${data.metrics.verifiedLabel}` : '');

    // Metrics
    miniAge.textContent = `${data.metrics.walletAgeDays} d`;
    miniTxs.textContent = `${data.metrics.totalTxCount}`;
    miniReports.textContent = `${data.metrics.scamReportCount}`;
    miniReports.style.color = data.metrics.scamReportCount > 0 ? '#f87171' : '#34d399';
    miniGraph.textContent = `${data.metrics.maliciousProximityScore}/100`;

    // Factors List
    factorList.innerHTML = '';

    // Render AI Synthesis Box
    if (data.explanation && data.explanation.aiSynthesis) {
      const ai = data.explanation.aiSynthesis;
      const aiItem = document.createElement('div');
      aiItem.className = 'f-item';
      aiItem.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))';
      aiItem.style.border = '1px solid rgba(168, 85, 247, 0.4)';
      aiItem.style.color = '#e2e8f0';
      aiItem.innerHTML = `
        <div style="font-weight:700; color:#c084fc; margin-bottom:2px;">🤖 Nemotron AI Synthesis</div>
        <div style="margin-bottom:4px;">${ai.summary}</div>
        <div style="color:#a7f3d0; font-size:9.5px;">💡 <strong>Rec:</strong> ${ai.recommendation}</div>
      `;
      factorList.appendChild(aiItem);
    }

    if (data.explanation.positiveFactors) {
      data.explanation.positiveFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'f-item pos';
        item.innerHTML = `<strong>✅ ${f.title}</strong>: ${f.description}`;
        factorList.appendChild(item);
      });
    }

    if (data.explanation.negativeFactors) {
      data.explanation.negativeFactors.forEach(f => {
        const item = document.createElement('div');
        item.className = 'f-item neg';
        item.innerHTML = `<strong>🚨 ${f.title}</strong>: ${f.description}`;
        factorList.appendChild(item);
      });
    }
  }
});
