const express = require('express');
const cors = require('cors');
const { fetchWalletMetrics } = require('./services/dataAggregator');
const { calculateReputation, answerWalletQuestion } = require('./engine/xaiEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration allowing Vercel production, preview deployments, local dev & extension hosts
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://reputex.vercel.app', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, Vercel Serverless, curl, postman or non-browser origin requests
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = rawAllowedOrigins.includes(origin);
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isChromeExtension = /^chrome-extension:\/\//.test(origin);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain || isChromeExtension || isLocalhost) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive CORS policy for public Chrome Extension consumers
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '1mb' }));

// Health Check Endpoint for Vercel, Kubernetes & Docker probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReputeX XAI Engine API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReputeX XAI Engine API', timestamp: new Date().toISOString() });
});

/**
 * Single Wallet / ENS Domain Analysis Endpoint
 * POST /api/reputation/analyze
 * Body: { address: "0x..." }
 */
app.post('/api/reputation/analyze', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({ error: 'Valid wallet address or ENS domain is required.' });
    }

    const cleanInput = address.trim();

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
 * Natural Language Wallet Q&A Chat Endpoint with Full Context Payload
 * POST /api/reputation/chat
 * Body: { address: "0x...", question: "Is this wallet safe?", context?: { ... } }
 */
app.post('/api/reputation/chat', async (req, res) => {
  try {
    const { address, question, context } = req.body;

    if (!address || !question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address and question string are required.' });
    }

    let reportContext = context;
    if (!reportContext || !reportContext.metrics) {
      const metrics = await fetchWalletMetrics(address.trim());
      reportContext = await calculateReputation(metrics);
    }

    const aiAnswer = await answerWalletQuestion(address.trim(), question.trim(), reportContext);

    return res.json({
      address: address.trim(),
      question: question.trim(),
      answer: aiAnswer,
      score: reportContext.score,
      riskCategory: reportContext.riskCategory,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error answering wallet question:', err);
    return res.status(500).json({ error: 'Failed to generate live AI answer.' });
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

// Run server directly when executed via Node.js
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ReputeX XAI Engine API Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` Single query: POST http://localhost:${PORT}/api/reputation/analyze`);
    console.log(` Chat assistant: POST http://localhost:${PORT}/api/reputation/chat`);
    console.log(` Batch query:  POST http://localhost:${PORT}/api/reputation/batch`);
    console.log(`====================================================`);
  });
}

// Export Express app handler for Vercel Serverless Functions
module.exports = app;
