# ReputeX: Multi-Chain Web3 Wallet Reputation, Pre-Sign Simulation & Network Graph Intelligence

[![Version](https://img.shields.io/badge/Version-3.0.0-6366f1.svg)](https://github.com/Aru-D-Rizz/ReputeX)
[![Manifest V3](https://img.shields.io/badge/Extension-Manifest_V3-6366f1.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Cross-Browser](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Opera%20%7C%20Brave-f59e0b.svg)](https://github.com/Aru-D-Rizz/ReputeX)
[![API Backend](https://img.shields.io/badge/API_Backend-Vercel_Serverless%20%2B%20Node.js-10b981.svg)](https://repute-x-iota.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Price Feed](https://img.shields.io/badge/Price_Feed-CoinGecko_Live_API-8dc63f.svg)](https://www.coingecko.com/)
[![AI Engine](https://img.shields.io/badge/AI_Model-Nvidia_Nemotron_3.5_Lightning-c084fc.svg)](https://openrouter.ai/)
[![Pre-Sign Simulation](https://img.shields.io/badge/Security-Pre--Sign_Transaction_Simulation-ef4444.svg)](#1-⚡-pre-sign-transaction-simulation-engine)
[![Network Graph](https://img.shields.io/badge/Visualizer-2D%2F3D_Counterparty_Network_Graph-14b8a6.svg)](#2-🕸️-interactive-2d3d-counterparty-network-graph)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ReputeX** is a browser extension and explainable AI (XAI) Web3 security platform. It automatically scans web pages for cryptocurrency wallet addresses across **6 major blockchains + ENS domains**, simulates transactions **before** signing in MetaMask or Phantom to prevent drainer scams, renders interactive **2D/3D counterparty network graphs**, evaluates on-chain transaction history using **continuous logarithmic and square-root curves with cryptographic micro-entropy**, verifies smart contract source code, cross-references community threat databases in real time via **Supabase PostgreSQL**, and provides an interactive AI security consultant powered by **Nvidia Nemotron 3.5 Lightning**.

---

## 🚀 Live Links & Quick Access

- **Production API Base**: [`https://repute-x-iota.vercel.app/api/reputation`](https://repute-x-iota.vercel.app/api/reputation)
- **Interactive Multi-Chain Test Suite & Demo**: [`https://repute-x-iota.vercel.app/demo/demo.html`](https://repute-x-iota.vercel.app/demo/demo.html)
- **GitHub Repository**: [`https://github.com/Aru-D-Rizz/ReputeX`](https://github.com/Aru-D-Rizz/ReputeX)
- **Current Version**: `3.0.0`

---

## 🌟 Key Implemented Features

### 1. ⚡ Pre-Sign Transaction Simulation Engine (Version 3.0)
ReputeX acts as an inline security firewall between decentralized applications (dApps) and user wallets (MetaMask, Phantom, Solflare).

- **Main Page Provider Wrapper (`extension/injected/injected.js`)**:
  - Injected into the web page context at `document_start` via `web_accessible_resources`.
  - Safely proxies `window.ethereum.request` and `window.solana.signAndSendTransaction`.
  - Intercepts signing requests: `eth_sendTransaction`, `personal_sign`, `eth_signTypedData`, `eth_signTypedData_v4`.
- **EVM ABI Selector Decoding (`backend/engine/simulationEngine.js`)**:
  - Decodes standard function signatures:
    - `0x095ea7b3`: ERC-20 `approve(address spender, uint256 amount)`
    - `0xa22cb465`: ERC-721 / ERC-1155 `setApprovalForAll(address operator, bool approved)`
    - `0xa9059cbb`: ERC-20 `transfer(address to, uint256 amount)`
    - `0x23b872dd`: ERC-20 `transferFrom(address from, address to, uint256 amount)`
    - Native currency transfers (`value` in Wei $\rightarrow$ ETH)
    - Off-chain message & typed permit signatures
- **Automated Threat & Allowance Analysis**:
  - **Unlimited Token Allowance Detection**: Flags transactions granting approval $\ge 10^{27}$ (e.g. `2^256 - 1` / `maxuint256`), warning that the spender can drain all tokens at any time.
  - **Full Collection NFT Approvals**: Detects `setApprovalForAll(operator, true)` granting third-party operators full transfer authority over an entire collection.
  - **Unverified Spender Warning**: Automatically queries target contract status; flags unverified contracts with elevated honeypot / drainer risk.
  - **Counterparty XAI Reputation Scoring**: Fetches on-chain trust score for target recipient/spender in real time.
- **Glassmorphism Pre-Sign Modal Overlay**:
  - Injected directly into the DOM (`reputex-presign-modal`).
  - Displays risk severity badges (`CRITICAL`, `HIGH`, `SAFE`), net asset change pills (`OUT`, `APPROVAL`), and counterparty score.
  - **Two-Action User Choice**:
    - **`⛔ Reject & Abort`**: Cancels the transaction and returns standard Web3 user rejection error (`code: 4001`) without prompting wallet popup.
    - **`✅ Proceed to Wallet`**: Passes the sanitized payload to MetaMask or Phantom for normal execution.

---

### 2. 🕸️ Interactive 2D/3D Counterparty Network Graph (Version 3.0)
Visualizes entity interaction clusters, transaction velocity, and proximity to malicious entities.

- **5th Tab in Extension Popup (`🕸️ Graph`)**:
  - Tab navigation: `📊 Score`, `🔍 Details`, `🕸️ Graph`, `💬 AI Chat`, `📋 History`.
- **Backend Graph Topology Engine (`backend/services/graphEngine.js`)**:
  - Endpoint: `GET /api/reputation/graph/:address`.
  - Generates 1-hop and 2-hop topological network structures.
  - Identifies counterparty classifications: DEX Protocols (Uniswap), CEX Hot Wallets (Binance, Coinbase), NFT Marketplaces (OpenSea), DeFi Lending (Aave), Privacy Mixers (Tornado Cash), Phishing Routers, and Drainer Contracts.
  - Returns node risk scores, edge transaction counts, and USD transaction volumes.
- **Bundled Canvas Force-Directed Engine (`extension/lib/vis-network.min.js`)**:
  - Standalone, zero-CDN canvas force-directed graph renderer strictly complying with Manifest V3 Content Security Policy (`script-src 'self'`).
  - Smooth spring physics, repulsion mechanics, velocity damping, and edge labels.
  - **Color-Coded Risk Halos**:
    - 🟢 **Green Halo**: Low Risk / Trusted entities (Score 80–100).
    - 🟡 **Yellow Halo**: Caution / Moderate entities (Score 55–79).
    - 🔴 **Red Halo**: High Risk / Scam contracts / Mixers (Score 0–54).

---

### 3. 🧠 Continuous Mathematical Scoring & Micro-Entropy (Version 2.1)
Eliminates score clustering (where wallets previously fell into coarse buckets like 66, 78, 88, 100) using continuous mathematical curves and cryptographic micro-entropy.

- **Continuous Mathematical Curves (`backend/engine/xaiEngine.js`)**:
  - **Base Score**: Starts at `35.0` points.
  - **Wallet Age Curve (Up to 15 pts)**:
    $$\text{Score}_{\text{age}} = \min\left(15, \sqrt{\frac{\text{ageDays}}{1825}} \times 15\right)$$
    *Wallets $< 7$ days old receive an immediate penalty of up to $-14$ pts.*
  - **Transaction Depth Curve (Up to 14 pts)**:
    $$\text{Score}_{\text{tx}} = \min\left(14, \frac{\ln(1 + \text{txCount})}{\ln(1 + 5000)} \times 14\right)$$
  - **USD Volume Commitment Curve (Up to 10 pts)**:
    $$\text{Score}_{\text{vol}} = \min\left(10, \frac{\log_{10}(1 + \text{volumeUSD})}{6} \times 10\right)$$
  - **Live USD Balance Curve (Up to 6 pts)**:
    $$\text{Score}_{\text{bal}} = \min\left(6, \frac{\log_{10}(1 + \text{balanceUSD})}{4.5} \times 6\right)$$
  - **Counterparty Diversity Curve (Up to 8 pts)**:
    $$\text{Score}_{\text{peers}} = \min\left(8, \text{uniquePeers}^{0.36} \times 1.5\right)$$
  - **Protocol Interaction Curve (Up to 12 pts)**:
    $$\text{Score}_{\text{proto}} = \min\left(12, \log_2(1 + \text{protoList.length}) \times 4.2\right)$$
  - **Smart Contract ABI Check**: Verified contract $= +10$ pts; Unverified contract $= -22$ pts.
  - **Verified Entity / ENS Signals**: Verified label $= +16$ pts; ENS domain $= +8$ pts.
  - **Scam & Proximity Penalties**: Flagged scam $= -14 \text{ to } -65$ pts; Known threat $= -32$ pts; High malicious graph proximity $= \text{up to } -40$ pts.
- **Cryptographic Micro-Entropy Dispersion ($\pm 2.0$ pts)**:
  - Generates a deterministic SHA-256 hash of the target address:
    $$\text{seed} = \text{hexToInt}(\text{SHA256}(\text{address})[0..6]) \pmod{1000}$$
    $$\Delta_{\text{entropy}} = \left(\frac{\text{seed}}{999}\right) \times 4.0 - 2.0$$
  - Ensures two wallets with similar profiles still display unique, non-clustered reputation scores while preserving 100% mathematical determinism.

---

### 4. ⚡ Multi-Chain Address Detection & Highlighting
Scans every text node on web pages using a high-performance, read-only DOM TreeWalker.

| Blockchain | Address Format & Validation | Example Pattern |
| :--- | :--- | :--- |
| **Ethereum & EVM** | 42-char hex checksum (ETH, BSC, Polygon, Arbitrum, Optimism) | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` |
| **Bitcoin** | Legacy P2PKH (`1...`), Script P2SH (`3...`), SegWit (`bc1q...`), Taproot (`bc1p...`) | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| **Solana** | Base58 public keys (32–44 chars) | `7xKXtg2CW87d8V6zXKBq7cM8Y2FPHwzaAkxqEqD7x4rH` |
| **Cardano** | Shelley Bech32 mainnet/testnet (`addr1...`, `addr_test1...`) | `addr1vpu5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5eg0yu80w` |
| **Polkadot** | SS58 Substrate relay chain (`1...`, `5...`) | `5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX` |
| **XRP Ledger** | Ripple Base58 accounts (`r...`) | `rN7n7otQDd6FczFgLdlqtyMVrn3HMfgnZh` |
| **ENS Domains** | Decentralized domain names (`.eth`, `.crypto`, `.wallet`, `.dao`) | `vitalik.eth` |

- **Non-Destructive Highlighting**: Replaces raw text with clickable badge pills (`⚡ ReputeX`, `🛡️ Safe`, `⚠️ Caution`, `🚨 Risk`) complying with strict Content Security Policies.
- **Dynamic SPA Support**: Debounced `MutationObserver` detects addresses loaded dynamically on Twitter/X, OpenSea, DexScreener, GitHub, and Etherscan.
- **Floating Hover Card**: Clicking any inline badge opens a dark-mode card with risk dial, 6-metric mini grid, entity breakdown bars, trust/risk factors, and inline AI assistant.

---

### 5. 🗄️ Supabase Cloud Database Integration (Version 2.0)
- **Crowdsourced Threat Reporting**: Users can flag malicious addresses (*Phishing*, *Wallet Drainer*, *Rug Pull*, *Impersonation*, *Other*) directly from the popup.
- **PostgreSQL Schema (`public.reports` & `public.watchlists`)**: Stores submissions with client fingerprints, timestamps, and categories.
- **Dynamic Scoring Penalties**: ReputeX queries Supabase on every scan to incorporate community reports into the scoring algorithm.
- **Connection Pooling**: Enterprise `pg.Pool` client configured with Supabase pooler over SSL with offline resilience.

---

### 6. 🦎 Live CoinGecko Market Valuation (Version 2.0)
- Fetches live USD price feeds for BTC, ETH, SOL, ADA, DOT, XRP, and BNB.
- In-memory 5-minute caching mechanism prevents API rate-limiting while providing accurate USD transaction volumes and balance valuations.

---

### 7. 🤖 Nvidia Nemotron AI Security Consultant
- **Primary Model**: `nvidia/nemotron-3.5-lightning:free` via OpenRouter.
- **Cascading Fallback Cascade**: Gemma 2 9B $\rightarrow$ Qwen 2.5 72B $\rightarrow$ Llama 3.3 70B $\rightarrow$ Nemotron 3 Ultra 550B.
- **Contextual Security Synthesis**: Generates plain-English summaries translating complex on-chain metrics into actionable recommendations.
- **Interactive Q&A**: Chat interface with quick-prompt chips (*"Is this wallet safe?"*, *"Why is this suspicious?"*, *"Risky connections?"*).

---

### 8. 🎨 5-Tab Dark Glassmorphism Popup UI
- **`📊 Score`**: Reputation ring gauge, risk level badge, network pill, wallet type classification bars, and 6-metric mini grid (**Age**, **Tx Count**, **Live Balance**, **Volume USD**, **Scam Reports**, **Graph Risk**).
- **`🔍 Details`**: Smart contract verification indicator, positive trust signals, risk & threat factors with custom non-clipping scrollbars, and community threat reporting form.
- **`🕸️ Graph`**: Interactive 2D/3D force-directed canvas counterparty graph.
- **`💬 AI Chat`**: Conversational security consultant with contextual memory.
- **`📋 History`**: Persistent local scan log in `chrome.storage.local` with one-click re-scan and clear button.

---

## 🛠️ Complete Project Architecture & Directory Map

```text
ReputeX/
├── index.html                               # Landing page
├── vercel.json                              # Vercel serverless routing & CORS configuration
├── docker-compose.yml                       # Docker configuration
├── scripts/
│   ├── build_posix_zips.py                  # Cross-browser POSIX packaging script (v1, v2, v2.1, v3)
│   └── build_ppt.py                         # Standalone PowerPoint generator script
├── supabase/
│   ├── config.toml                          # Supabase CLI configuration
│   └── migrations/
│       └── 20260903000000_init_reputex.sql  # Threat reports & watchlists PostgreSQL schema
├── k8s/                                     # Kubernetes deployment manifests
├── backend/
│   ├── server.js                            # Express API Server & routes
│   ├── engine/
│   │   ├── xaiEngine.js                     # Continuous scoring engine & Nemotron AI consultant
│   │   └── simulationEngine.js              # EVM ABI decoder, allowance checker & pre-sign simulator
│   ├── services/
│   │   ├── dbService.js                     # Supabase pg.Pool client & queries
│   │   ├── dataAggregator.js                # Multi-chain API fetcher (Etherscan, Esplora, Koios, Subscan, XRPL, CoinGecko)
│   │   └── graphEngine.js                   # 1-hop & 2-hop topological network graph generator
│   └── data/
│       └── scamDatabase.json                # Local threat registry & known safe entities
├── extension/                               # Chromium extension build (Chrome, Edge, Opera, Brave)
│   ├── manifest.json                        # Manifest V3 configuration (v3.0.0)
│   ├── injected/
│   │   └── injected.js                      # Main page provider proxy (window.ethereum & window.solana interceptor)
│   ├── lib/
│   │   └── vis-network.min.js               # Bundled CSP-compliant canvas force-directed graph renderer
│   ├── background/
│   │   └── service_worker.js                # Background worker, cache & API router
│   ├── content/
│   │   ├── content.js                       # DOM scanner, pre-sign modal renderer & hover overlay
│   │   └── content.css                      # Inline badges, hover card & pre-sign modal styling
│   ├── popup/
│   │   ├── popup.html                       # 5-tab popup interface
│   │   ├── popup.js                         # Tab switching, graph canvas init & report controller
│   │   └── popup.css                        # Glassmorphism dark theme styling
│   └── icons/                               # Application icons (16, 48, 128px)
├── extension-firefox/                       # Mozilla Firefox build (Gecko & Gecko Android)
│   ├── manifest.json                        # Firefox MV3 manifest with gecko ID & permissions
│   ├── injected/injected.js                 # Firefox provider proxy
│   └── lib/vis-network.min.js               # Firefox bundled graph renderer
├── demo/
│   └── demo.html                            # Interactive multi-chain test suite & pre-sign simulation triggers
└── api/
    └── index.js                             # Vercel Serverless Function entry point
```

---

## 📡 Complete REST API Reference

Base Production URL: `https://repute-x-iota.vercel.app/api/reputation`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and operational status |
| `POST` | `/api/reputation/simulate` | **(v3.0)** Pre-sign transaction simulation, allowance risk check, and net balance change analysis |
| `GET` | `/api/reputation/graph/:address` | **(v3.0)** 1-hop and 2-hop network graph topology for an address |
| `POST` | `/api/reputation/analyze` | Complete multi-chain analysis and XAI score for a single address |
| `POST` | `/api/reputation/batch` | High-speed batch reputation scan for multiple addresses (up to 50) |
| `POST` | `/api/reputation/chat` | Contextual Q&A with Nvidia Nemotron AI consultant |
| `GET` | `/api/reputation/prices` | Cached real-time crypto prices from CoinGecko |
| `POST` | `/api/reputation/report` | Submit community threat report directly to Supabase DB |
| `GET` | `/api/reputation/reports/:address` | Fetch existing community threat reports for an address |
| `POST` | `/api/reputation/watchlist` | Add an address to user watchlist |
| `GET` | `/api/reputation/watchlist/:clientId` | Retrieve saved watchlist for a client |
| `DELETE` | `/api/reputation/watchlist/:id` | Remove an address from watchlist |

### API Usage Examples

#### 1. Pre-Sign Simulation (`POST /api/reputation/simulate`)
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "method": "eth_sendTransaction",
    "params": [{
      "from": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "to": "0x0000000000000000000000000000000000000001",
      "data": "0x095ea7b30000000000000000000000001111111111111111111111111111111111111111ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    }]
  }'
```

#### 2. Network Graph Topology (`GET /api/reputation/graph/:address`)
```bash
curl -X GET https://repute-x-iota.vercel.app/api/reputation/graph/vitalik.eth
```

#### 3. Single Address Analysis (`POST /api/reputation/analyze`)
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
```

#### 4. Interactive AI Chat (`POST /api/reputation/chat`)
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/chat \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "question": "Why is this wallet considered low risk?"
  }'
```

---

## 📥 Installation & Setup Guide

The extension connects out-of-the-box to the live hosted Vercel backend (`https://repute-x-iota.vercel.app/`). No local servers or Node.js required for normal use.

### Install in Chrome, Edge, Brave, and Opera
1. Clone the repository:
   ```bash
   git clone https://github.com/Aru-D-Rizz/ReputeX.git
   ```
2. Open your browser extension management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the **`extension`** directory.

### Install in Mozilla Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from the **`extension-firefox`** directory (or select `ReputeX-Firefox-Extension-v3.zip`).

---

## 🧪 Testing & Verification Guide

### 1. Interactive Web3 Demo Page
Open [`demo/demo.html`](file:///c:/Users/Aldrid/Desktop/ReputeX/demo/demo.html) in your browser or visit [https://repute-x-iota.vercel.app/demo/demo.html](https://repute-x-iota.vercel.app/demo/demo.html):
- **Test Pre-Sign Simulation**:
  - Click `🚨 Trigger Unlimited Token Approval` $\rightarrow$ Confirm ReputeX intercepts the call and displays the critical warning modal before MetaMask opens.
  - Click `⚠️ Trigger NFT SetApprovalForAll` $\rightarrow$ Confirm collection-wide transfer warning displays.
  - Click `✍️ Trigger Personal Sign Request` $\rightarrow$ Confirm signature warning displays.
  - Test clicking `⛔ Reject & Abort` (cancels request with Web3 code 4001) vs `✅ Proceed to Wallet` (passes to wallet).
- **Test Address Highlighting**:
  - Hover or click on the Ethereum, Bitcoin, Solana, Cardano, Polkadot, or XRP sample address badges to open the floating hover overlay card.

### 2. Network Graph Visualization
1. Open the ReputeX extension popup by clicking the toolbar icon.
2. Enter `vitalik.eth` or any address and click **Scan**.
3. Switch to the **`🕸️ Graph`** tab to view the force-directed 1-hop and 2-hop counterparty network graph with color-coded risk halos.

### 3. Automated Backend Unit Test
Run the backend simulation & graph verification script directly from your terminal:
```bash
node -e "const { simulateTransaction } = require('./backend/engine/simulationEngine'); const { generateCounterpartyGraph } = require('./backend/services/graphEngine'); (async () => { console.log('SIMULATION:', await simulateTransaction({ method: 'eth_sendTransaction', params: [{ from: '0xd8dA...', to: '0x000...', data: '0x095ea7b30000000000000000000000001111111111111111111111111111111111111111ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' }] })); console.log('GRAPH:', await generateCounterpartyGraph('vitalik.eth')); })();"
```

---

## 🔒 Security & Privacy Commitments

- **Zero Private Key Access**: ReputeX never asks for, accesses, or transmits private keys, seed phrases, or wallet keystores.
- **Strict Isolated Worlds**: Extension content scripts run in isolated execution contexts; no unverified third-party `<script>` tags are injected.
- **XSS-Free DOM Operations**: Uses `textContent` and `createElement` APIs exclusively; no `innerHTML` injection of unescaped blockchain inputs.
- **Local Storage Privacy**: Scan history is stored only on the client machine via `chrome.storage.local`.
- **Encrypted Transmission**: All external requests communicate strictly over TLS/HTTPS.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
