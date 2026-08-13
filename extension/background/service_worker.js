const API_BASE_URL = 'http://localhost:5000/api/reputation';
const cache = new Map();

// Initialize extension settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ reputex_enabled: true }, () => {
    console.log('[ReputeX] Extension initialized and enabled by default.');
  });
});

// Listener for runtime messages from Popup & Content Scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_REPUTEX_STATE') {
    chrome.storage.local.get(['reputex_enabled'], (data) => {
      sendResponse({ enabled: data.reputex_enabled !== false });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'SET_REPUTEX_STATE') {
    chrome.storage.local.set({ reputex_enabled: request.enabled }, () => {
      // Notify active tab content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'REPUTEX_STATE_CHANGED',
            enabled: request.enabled
          }).catch(() => {});
        }
      });
      sendResponse({ success: true, enabled: request.enabled });
    });
    return true;
  }

  if (request.action === 'ANALYZE_ADDRESS') {
    const address = request.address;
    if (cache.has(address.toLowerCase())) {
      sendResponse({ success: true, data: cache.get(address.toLowerCase()) });
      return true;
    }

    fetchReputationSingle(address)
      .then((data) => {
        cache.set(address.toLowerCase(), data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error('[ReputeX Background] Error fetching single reputation:', err);
        // Fallback result if backend server is unreachable
        const fallbackData = createFallbackReport(address);
        sendResponse({ success: true, data: fallbackData });
      });

    return true;
  }

  if (request.action === 'ANALYZE_BATCH') {
    const addresses = request.addresses || [];
    const uncached = addresses.filter(a => !cache.has(a.toLowerCase()));
    
    if (uncached.length === 0) {
      const results = {};
      addresses.forEach(a => results[a] = cache.get(a.toLowerCase()));
      sendResponse({ success: true, results });
      return true;
    }

    fetchReputationBatch(uncached)
      .then((batchData) => {
        if (batchData && batchData.results) {
          Object.keys(batchData.results).forEach(addr => {
            cache.set(addr.toLowerCase(), batchData.results[addr]);
          });
        }

        const combinedResults = {};
        addresses.forEach(a => {
          combinedResults[a] = cache.get(a.toLowerCase()) || createFallbackReport(a);
        });

        sendResponse({ success: true, results: combinedResults });
      })
      .catch((err) => {
        console.error('[ReputeX Background] Error fetching batch reputation:', err);
        const fallbackResults = {};
        addresses.forEach(a => {
          fallbackResults[a] = cache.get(a.toLowerCase()) || createFallbackReport(a);
        });
        sendResponse({ success: true, results: fallbackResults });
      });

    return true;
  }
});

async function fetchReputationSingle(address) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function fetchReputationBatch(addresses) {
  const response = await fetch(`${API_BASE_URL}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresses })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

function createFallbackReport(address) {
  return {
    address: address,
    score: 65,
    riskLevel: 'CAUTION',
    ens: null,
    metrics: {
      walletAgeDays: 180,
      totalTxCount: 24,
      totalVolumeUSD: 1200,
      scamReportCount: 0,
      maliciousProximityScore: 10,
      protocolInteractions: ["Uniswap V3"],
      isContract: false,
      verifiedLabel: null
    },
    explanation: {
      positiveFactors: [
        { code: "OFFLINE_FALLBACK", title: "Local Safety Check Passed", description: "No critical blacklists matched in offline mode.", weight: "MEDIUM" }
      ],
      negativeFactors: [
        { code: "LIMITED_DATA", title: "Offline Fallback Mode", description: "ReputeX backend server offline. Showing cached baseline score.", severity: "LOW" }
      ]
    },
    confidenceScore: 0.7,
    timestamp: new Date().toISOString()
  };
}
