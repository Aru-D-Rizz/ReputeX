const express = require('express');
const cors = require('cors');
const { fetchWalletMetrics } = require('./services/dataAggregator');
const { calculateReputation, answerWalletQuestion } = require('./engine/xaiEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Server-Side In-Memory Cache (10-Minute TTL for Sub-50ms Repeat Lookups)
const analyzeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedReport(address) {
  const key = address.toLowerCase();
  const entry = analyzeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analyzeCache.delete(key);
    return null;
  }
  return entry.report;
}

function setCachedReport(address, report) {
  const key = address.toLowerCase();
  analyzeCache.set(key, {
    timestamp: Date.now(),
    report: report
  });
  if (analyzeCache.size > 1000) {
    const oldestKey = analyzeCache.keys().next().value;
    analyzeCache.delete(oldestKey);
  }
}

// Dynamic CORS configuration allowing Vercel production, preview deployments, local dev & browser extensions
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://reputex.vercel.app', 'https://repute-x-iota.vercel.app', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = rawAllowedOrigins.includes(origin);
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isBrowserExtension = /^chrome-extension:\/\//.test(origin) || /^ms-browser-extension:\/\//.test(origin) || /^moz-extension:\/\//.test(origin);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain || isBrowserExtension || isLocalhost) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

// Health Check Endpoint for Vercel, Kubernetes & Docker probes
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'ReputeX XAI Engine API', timestamp: new Date().toISOString() });
});

// API Root Index Info Route
app.all(['/api/reputation', '/api/reputation/', '/'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReputeX XAI Engine API',
    message: 'ReputeX API backend is online and operational.',
    endpoints: {
      analyze: 'POST /api/reputation/analyze',
      chat: 'POST /api/reputation/chat',
      batch: 'POST /api/reputation/batch',
      health: 'GET /health'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Single Wallet / ENS Domain Analysis Endpoint
 * Handles /api/reputation/analyze, /reputation/analyze, and /analyze
 */
app.post(['/api/reputation/analyze', '/reputation/analyze', '/analyze'], async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({ error: 'Valid wallet address or ENS domain is required.' });
    }

    const cleanInput = address.trim();

    const evmPattern = /^0x[a-fA-F0-9]{40}$/;
    const btcPattern = /^(bc1[a-zA-Z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
    const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const adaPattern = /^(addr1[a-z0-9]{50,100}|addr_test1[a-z0-9]{50,100})$/i;
    const dotPattern = /^[15][a-km-zA-HJ-NP-Z1-9]{46,47}$/;
    const xrpPattern = /^r[0-9a-zA-Z]{24,34}$/;
    const domainPattern = /^[a-zA-Z0-9-]+\.(eth|org|io|crypto|wallet|dao)$/i;

    if (!evmPattern.test(cleanInput) && !btcPattern.test(cleanInput) && !solanaPattern.test(cleanInput) && !adaPattern.test(cleanInput) && !dotPattern.test(cleanInput) && !xrpPattern.test(cleanInput) && !domainPattern.test(cleanInput)) {
      return res.status(400).json({ error: 'Invalid wallet address or ENS domain format.' });
    }

    // Return Server Cached Report if Available (< 50ms Response)
    const cachedReport = getCachedReport(cleanInput);
    if (cachedReport) {
      return res.json({ ...cachedReport, cached: true });
    }

    const metrics = await fetchWalletMetrics(cleanInput);
    const report = await calculateReputation(metrics);

    setCachedReport(cleanInput, report);
    return res.json(report);
  } catch (err) {
    console.error('Error analyzing wallet address:', err);
    return res.status(500).json({ error: 'Internal server error processing reputation score.' });
  }
});

/**
 * Natural Language Wallet Q&A Chat Endpoint with Full Context Payload
 * Handles /api/reputation/chat, /reputation/chat, and /chat
 */
app.post(['/api/reputation/chat', '/reputation/chat', '/chat'], async (req, res) => {
  try {
    const { address, question, context } = req.body;

    if (!address || !question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address and question string are required.' });
    }

    let reportContext = context;
    if (!reportContext || !reportContext.metrics) {
      const cached = getCachedReport(address.trim());
      if (cached) {
        reportContext = cached;
      } else {
        const metrics = await fetchWalletMetrics(address.trim());
        reportContext = await calculateReputation(metrics);
        setCachedReport(address.trim(), reportContext);
      }
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
 * Batch Wallet Analysis Endpoint
 * Handles /api/reputation/batch, /reputation/batch, and /batch
 */
app.post(['/api/reputation/batch', '/reputation/batch', '/batch'], async (req, res) => {
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
          const clean = addr.trim();
          const cached = getCachedReport(clean);
          if (cached) {
            results[clean] = cached;
          } else {
            const metrics = await fetchWalletMetrics(clean);
            const report = await calculateReputation(metrics);
            setCachedReport(clean, report);
            results[clean] = report;
          }
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
