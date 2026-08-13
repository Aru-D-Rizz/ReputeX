const express = require('express');
const cors = require('cors');
const { fetchWalletMetrics } = require('./services/dataAggregator');
const { calculateReputation } = require('./engine/xaiEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Chrome/Edge Extensions and local dev origins
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReputeX XAI Engine API', timestamp: new Date().toISOString() });
});

/**
 * Single Wallet / ENS Domain Analysis Endpoint
 * POST /api/reputation/analyze
 * Body: { address: "0x..." or "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" or "vitalik.eth" }
 */
app.post('/api/reputation/analyze', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({ error: 'Valid wallet address or ENS domain is required.' });
    }

    const cleanInput = address.trim();

    // Validation pattern for EVM address, Solana, Bitcoin, or ENS/Web3 domain string
    const evmPattern = /^0x[a-fA-F0-9]{40}$/;
    const btcPattern = /^(bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
    const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const domainPattern = /^[a-zA-Z0-9-]+\.(eth|org|io|crypto|wallet|dao)$/i;

    if (!evmPattern.test(cleanInput) && !btcPattern.test(cleanInput) && !solanaPattern.test(cleanInput) && !domainPattern.test(cleanInput)) {
      return res.status(400).json({ error: 'Invalid wallet address or ENS domain format.' });
    }

    const metrics = await fetchWalletMetrics(cleanInput);
    const report = await calculateReputation(metrics);

    return res.json(report);
  } catch (err) {
    console.error('Error analyzing wallet address:', err);
    return res.status(500).json({ error: 'Internal server error processing reputation score.' });
  }
});

/**
 * Batch Wallet Analysis Endpoint (For Extension Webpage Content Script)
 * POST /api/reputation/batch
 * Body: { addresses: ["0x...", "1A1zP1..."] }
 */
app.post('/api/reputation/batch', async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: 'Array of wallet addresses is required.' });
    }

    const uniqueAddresses = Array.from(new Set(addresses.slice(0, 50)));
    const results = {};

    for (const addr of uniqueAddresses) {
      if (typeof addr === 'string' && addr.trim().length > 0) {
        try {
          const metrics = await fetchWalletMetrics(addr.trim());
          results[addr] = await calculateReputation(metrics);
        } catch (singleErr) {
          console.error(`Failed to analyze ${addr}:`, singleErr);
        }
      }
    }

    return res.json({ results });
  } catch (err) {
    console.error('Error in batch analysis endpoint:', err);
    return res.status(500).json({ error: 'Failed to process batch wallet scanning.' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` ReputeX XAI Engine API Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Single query: POST http://localhost:${PORT}/api/reputation/analyze`);
  console.log(` Batch query:  POST http://localhost:${PORT}/api/reputation/batch`);
  console.log(`====================================================`);
});
