# ReputeX: Multi-Chain Web3 Wallet Reputation & XAI Risk Assessment

[![Manifest V3](https://img.shields.io/badge/Extension-Manifest_V3-6366f1.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Cross-Browser](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Opera%20%7C%20Brave-f59e0b.svg)](https://github.com/Aru-D-Rizz/ReputeX)
[![API Backend](https://img.shields.io/badge/API_Backend-Vercel_Serverless%20%2B%20Node.js-10b981.svg)](https://repute-x-iota.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Price Feed](https://img.shields.io/badge/Price_Feed-CoinGecko_Live_API-8dc63f.svg)](https://www.coingecko.com/)
[![AI Engine](https://img.shields.io/badge/AI_Model-Nvidia_Nemotron_3.5_Lightning-c084fc.svg)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ReputeX** is a browser extension and explainable AI (XAI) Web3 security platform. It automatically scans web pages for cryptocurrency wallet addresses across **6 major blockchains + ENS domains**, evaluates on-chain transaction history, verifies smart contract source code, cross-references community threat databases in real time, and renders an explainable reputation score with an interactive AI security consultant.

---

## ✨ Implemented Features (Version 2.0)

### 1. ⚡ Multi-Chain Address Detection & Highlighting
- **6 Supported Blockchains + ENS**:
  - **Ethereum & EVM Chains**: Full checksum validation for Ethereum, Binance Smart Chain, Polygon, Arbitrum, Optimism (`0x...` 42-char hex).
  - **Bitcoin**: Legacy P2PKH (`1...`), Script P2SH (`3...`), Native SegWit (`bc1q...`), and Taproot (`bc1p...`).
  - **Solana**: Base58 public keys (32–44 characters).
  - **Cardano**: Shelley Bech32 mainnet and testnet addresses (`addr1...`, `addr_test1...`).
  - **Polkadot**: SS58 Substrate relay chain addresses (`1...`, `5...`).
  - **XRP Ledger**: Ripple Base58 accounts (`r...`).
  - **ENS Domains**: Native resolution for `.eth`, `.org`, `.crypto`, `.wallet`, `.dao`.
- **Read-Only DOM Parser**: High-performance text node tree walker that safely skips input boxes, password fields, scripts, styles, and iframes without injecting unverified code.
- **Dynamic SPA Support**: Uses a debounced `MutationObserver` to automatically detect addresses loaded dynamically on Twitter/X, Etherscan, OpenSea, GitHub, and DexScreener.
- **Non-Destructive Highlighting**: Replaces raw text with clickable badge pills (`⚡ ReputeX`, `🛡️ Safe`, `⚠️ Caution`, `🚨 Risk`) complying with strict Content Security Policies (CSP).

---

### 2. 🧠 Explainable AI (XAI) Scoring & Risk Engine
- **Deterministic & Real-Time Scoring (0–100 Scale)**:
  - **`LOW RISK / TRUSTED`** (80–100): Established wallet age, high transaction volume, zero malicious counterparty interactions.
  - **`CAUTION / MEDIUM RISK`** (55–79): Moderate activity, new or dormant address, or minor risk indicators.
  - **`HIGH RISK`** (30–54): Unverified smart contract code, rapid fund velocity, or 2-hop proximity to flagged entities.
  - **`CRITICAL RISK`** (0–29): Direct interaction with mixers (Tornado Cash), wallet drainers, phishing reports, or known scam registries.
- **🛡️ Smart Contract Verification Check**:
  - Queries Etherscan ABI API in real-time.
  - Verified public smart contracts earn a **+12 trust boost**.
  - Unverified contracts trigger an immediate **-20 risk penalty** and an alert banner.
- **🦎 Live CoinGecko Market Valuation**:
  - Live price feeds for BTC, ETH, SOL, ADA, DOT, XRP, and BNB.
  - Automatically calculates real-time USD balances and transacted volumes using live market prices (with 5-minute memory caching).
- **🕸️ Graph Risk & Proximity Index**:
  - Calculates 1-hop and 2-hop counterparty proximity scores to known malicious clusters.
- **🏷️ Likely Wallet Type Classification**:
  - Multi-class entity prediction breakdown: `Personal wallet`, `Exchange`, `Merchant`, `Whale`, `Mining pool`, `Payment processor`, `Bot`, `Mixer`, `Possible scam wallet`.
- **🤖 Nvidia Nemotron AI Security Synthesis**:
  - Translates complex on-chain metrics into plain English summaries with actionable security recommendations.

---

### 3. 🗄️ Supabase Cloud Database Integration
- **🚩 In-Popup Community Threat Reporting**:
  - Users can flag malicious addresses (*Phishing*, *Wallet Drainer*, *Rug Pull*, *Impersonation*, *Other*) directly from the extension popup.
  - Reports are stored in Supabase PostgreSQL (`public.reports`) with category, description, and timestamp.
  - The scoring engine dynamically queries Supabase and penalizes flagged addresses in real time.
- **📋 Persistent Watchlists**:
  - `public.watchlists` table for bookmarking and monitoring critical wallet addresses.
- **Enterprise Connection Pooling**:
  - Built with PostgreSQL connection pooling (`pg.Pool`) via Supabase pooler with SSL encryption and graceful offline fallback.

---

### 4. 🎨 Redesigned Extension Popup UI (Dark Glassmorphism)
- **Tabbed Organization**:
  - **`📊 Score`**: Reputation dial, risk level, chain badge, entity classification bars, and 6-metric grid.
  - **`🔍 Details`**: Smart contract verification pill, XAI trust and risk factors with custom non-clipping glassmorphism scrollbars, Nvidia AI synthesis card, and report form modal.
  - **`💬 AI Chat`**: Interactive AI security consultant with quick preset question chips and scrollable response box.
  - **`📋 History`**: Persistent local scan log stored in `chrome.storage.local` with one-click re-scanning and a clear button.
- **6-Metric Mini Grid**:
  - Displays **Wallet Age**, **Tx Count**, **Live Balance**, **Volume (USD)**, **Scam Reports**, and **Graph Risk**.
- **Horizontal Quick-Chips Bar**:
  - One-click testing for Vitalik.eth, Satoshi Genesis BTC, Solana, Cardano, Polkadot, and XRP without awkward text wrapping.
- **Network Badges**:
  - Color-coded network indicators: `ETH` (Blue), `BTC` (Gold), `SOL` (Purple), `ADA` (Cyan), `DOT` (Pink), `XRP` (Green).
- **Zero-Clipping Guarantee**:
  - Custom glassmorphism scrollbars (`::-webkit-scrollbar`), bounded max-heights, and `overflow-wrap: break-word` across all alert items.

---

### 5. 🌐 Floating Webpage Hover Card Overlay
- Clicking any inline address badge on a webpage opens a floating dark-mode card.
- Displays the score dial, chain badge, 6-metric grid, entity classification bars, trust factors, risk flags, and an embedded inline chat assistant.

---

### 6. 🦊 Cross-Browser Store Compatibility
- Separate optimized builds for:
  - **Google Chrome** (`ReputeX-Chrome-Extension.zip`)
  - **Microsoft Edge** (`ReputeX-Edge-Extension.zip`)
  - **Mozilla Firefox & Firefox Android** (`ReputeX-Firefox-Extension.zip`)
  - **Opera** (`ReputeX-Opera-Extension.zip`)
- Packaged with standard POSIX forward-slash archives to satisfy strict Chrome Web Store and Mozilla AMO automated validators.

---

## 📥 How to Install the Extension

The extension connects out-of-the-box to the live hosted Vercel backend (`https://repute-x-iota.vercel.app/`). No local servers or Node.js required!

### For Chrome, Edge, Brave, and Opera:
1. Clone or download this repository:
   ```bash
   git clone https://github.com/Aru-D-Rizz/ReputeX.git
   ```
2. Navigate to your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
3. Toggle **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the **`extension`** folder from the repository.

### For Mozilla Firefox:
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from the **`extension-firefox`** folder (or select `ReputeX-Firefox-Extension.zip`).

---

## 🧪 Test Environment & Demo Page

Open the live Web3 test environment to see ReputeX detect and score multiple blockchains simultaneously:
- **Live Demo**: **[https://repute-x-iota.vercel.app/demo/demo.html](https://repute-x-iota.vercel.app/demo/demo.html)**
- Or open `demo/demo.html` locally in any browser with the extension installed.

---

## 🛠️ Project Architecture

```text
ReputeX/
├── index.html                               # Landing page
├── vercel.json                              # Vercel serverless routing & CORS configuration
├── scripts/
│   └── build_posix_zips.py                  # Cross-browser POSIX packaging script
├── supabase/
│   ├── config.toml                          # Supabase configuration
│   └── migrations/
│       └── 20260903000000_init_reputex.sql  # Threat reports & watchlists PostgreSQL schema
├── backend/
│   ├── .env.example                         # Environment credentials template
│   ├── server.js                            # Express API Server & routes
│   ├── services/
│   │   ├── dbService.js                     # Supabase pg.Pool client & queries
│   │   └── dataAggregator.js                # CoinGecko, Etherscan ABI & Esplora data fetcher
│   ├── engine/
│   │   └── xaiEngine.js                     # Multi-factor scoring engine & Nemotron AI consultant
│   └── data/
│       └── scamDatabase.json                # Local threat registry & known safe entities
├── extension/                               # Chromium extension build (Chrome, Edge, Opera, Brave)
│   ├── manifest.json                        # Manifest V3 configuration (v2.0.0)
│   ├── background/service_worker.js         # Background worker, cache & API router
│   ├── content/
│   │   ├── content.js                       # Read-only DOM scanner & hover overlay builder
│   │   └── content.css                      # Inline badges & hover card styles
│   ├── popup/
│   │   ├── popup.html                       # Tabbed popup interface
│   │   ├── popup.js                         # Tab switching, history, search & report controller
│   │   └── popup.css                        # Glassmorphism dark theme styling
│   └── icons/                               # Application icons (16, 48, 128px)
├── extension-firefox/                       # Mozilla Firefox build (Gecko & Gecko Android)
│   └── manifest.json                        # Firefox MV3 manifest with gecko ID & data permissions
└── demo/
    └── demo.html                            # Web3 multi-chain test page
```

---

## 📡 API Reference

Base Production URL: `https://repute-x-iota.vercel.app/api/reputation`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server status and health check |
| `POST` | `/api/reputation/analyze` | Complete multi-chain analysis for a single address |
| `POST` | `/api/reputation/batch` | High-speed batch reputation scan for multiple addresses |
| `POST` | `/api/reputation/chat` | Contextual Q&A conversation with Nemotron AI consultant |
| `GET` | `/api/reputation/prices` | Cached real-time crypto prices from CoinGecko |
| `POST` | `/api/reputation/report` | Submit community threat report directly to Supabase DB |
| `GET` | `/api/reputation/reports/:address` | Fetch existing community threat reports for an address |
| `POST` | `/api/reputation/watchlist` | Add an address to user watchlist |
| `GET` | `/api/reputation/watchlist/:clientId` | Retrieve saved watchlist for a client |
| `DELETE` | `/api/reputation/watchlist/:id` | Remove an address from watchlist |

### Example Analysis Payload:
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
```

---

## 🔒 Security & Privacy Commitments

- **No Private Keys**: ReputeX never requests or accesses private keys, seed phrases, or wallet signatures.
- **Zero Injections**: Content scripts operate in isolated worlds and never inject external third-party `<script>` tags.
- **Safe DOM APIs**: Exclusively uses `textContent` and `createElement` DOM operations to eliminate Cross-Site Scripting (XSS).
- **Encrypted Communication**: All external requests are performed over TLS/HTTPS.

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for details.
