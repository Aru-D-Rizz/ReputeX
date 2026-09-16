# ReputeX — Product Showcase & Launch Presentation
### Multi-Chain Web3 Wallet Reputation & Explainable AI Risk Assessment Platform

---

## 🔗 Quick Links

- **GitHub Repository**: [github.com/Aru-D-Rizz/ReputeX](https://github.com/Aru-D-Rizz/ReputeX)
- **Live Backend / Demo**: [repute-x-iota.vercel.app](https://repute-x-iota.vercel.app/)
- **Current Version**: 2.1.0

---

# 1. PRODUCT OVERVIEW — THE PROBLEM & OUR SOLUTION

## The Problem: Web3 Trust is Broken

Every day, millions of crypto users encounter wallet addresses on Twitter/X, Discord, Telegram, GitHub, Etherscan, OpenSea, and DexScreener. They have no way to instantly know:

- **Is this wallet safe to transact with?**
- **Has this address been flagged for phishing, rug pulls, or wallet drainer scams?**
- **Is this smart contract verified or a trap?**
- **What is the on-chain reputation history of this address?**

Currently, users must:
1. Manually copy the wallet address
2. Open a separate tab (Etherscan, Blockchain.com, Solscan, etc.)
3. Paste and search the address
4. Manually interpret raw transaction data
5. Repeat this process for **every single address** they encounter

This is slow, tedious, and error-prone. Most users skip it entirely — leading to billions of dollars lost to scams annually.

## The Solution: ReputeX

**ReputeX** is a browser extension that **automatically detects and scores every cryptocurrency wallet address you encounter on any webpage** — in real time, across 6 major blockchains and ENS domains.

No copy-pasting. No tab switching. No manual lookups. Just instant, inline trust signals powered by Explainable AI.

### One-Line Elevator Pitch
> *"ReputeX is Grammarly for Web3 wallets — it scans every address on any webpage and instantly tells you if it's safe or a scam."*

---

# 2. KEY FEATURES — WHAT MAKES REPUTEX UNIQUE

## 2.1 ⚡ Automatic Multi-Chain Address Detection

ReputeX's content script uses a high-performance **read-only DOM tree walker** that scans every text node on any webpage and automatically detects wallet addresses from **6 major blockchains + ENS domains**:

| Blockchain | Address Format | Example Pattern |
|:--|:--|:--|
| **Ethereum & EVM Chains** | 42-character hex with checksum validation | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` |
| **Bitcoin** | Legacy (1...), P2SH (3...), SegWit (bc1q...), Taproot (bc1p...) | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| **Solana** | Base58 public keys (32–44 chars) | `5FHwkrdxkSoSFvbdbGhBKP3...` |
| **Cardano** | Shelley Bech32 mainnet/testnet | `addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp` |
| **Polkadot** | SS58 Substrate relay chain | `1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg` |
| **XRP Ledger** | Ripple Base58 accounts | `rN7d4xhPRcQ6zC9rJDvy6D3...` |
| **ENS Domains** | .eth, .org, .crypto, .wallet, .dao | `vitalik.eth` |

### Dynamic SPA Support
Uses a debounced `MutationObserver` to automatically detect addresses loaded dynamically on:
- Twitter/X feeds
- Etherscan transaction pages
- OpenSea NFT listings
- GitHub repositories
- DexScreener token pages
- Any web application with dynamically loaded content

### Non-Destructive Highlighting
Detected addresses are replaced with **clickable badge pills** indicating risk level:
- `⚡ ReputeX` — Scanning/Pending
- `🛡️ Safe` — Low Risk (80–100 score)
- `⚠️ Caution` — Medium Risk (55–79 score)
- `🚨 Risk` — High/Critical Risk (0–54 score)

---

## 2.2 🧠 Explainable AI (XAI) Scoring Engine

ReputeX uses a **multi-factor continuous mathematical scoring engine** that produces a deterministic, explainable reputation score from 0 to 100.

### Scoring Architecture — Continuous Curves (Not Step Functions)

Unlike simple rule-based systems that produce clustered scores (everyone gets 66 or 78 or 88), ReputeX v2.1 uses **continuous mathematical curves** that produce truly unique scores for every wallet:

| Factor | Mathematical Curve | Max Points |
|:--|:--|:--|
| **Wallet Age** | Square-root: `√(ageDays / 1825) × 15` | 15 pts |
| **Transaction Count** | Natural log: `ln(1 + txCount) / ln(1 + 5000) × 14` | 14 pts |
| **Transaction Volume (USD)** | Log10: `log₁₀(1 + volumeUSD) / 6 × 10` | 10 pts |
| **Live Balance (USD)** | Log10: `log₁₀(1 + balanceUSD) / 4.5 × 6` | 6 pts |
| **Counterparty Diversity** | Power: `uniquePeers^0.36 × 1.5` | 8 pts |
| **Protocol Interactions** | Log2: `log₂(1 + protoCount) × 4.2` | 12 pts |
| **Smart Contract Verification** | Binary: verified = +12, unverified contract = −20 | ±20 pts |
| **Scam Database Cross-Reference** | Direct penalty: known scam = 0 score | −100 pts |
| **Cryptographic Entropy Dispersion** | SHA-256 hash → ±2.0 pts deterministic variance | ±2 pts |

### Risk Classification Tiers

| Score Range | Risk Level | Visual Indicator |
|:--|:--|:--|
| 80–100 | `LOW RISK / TRUSTED` | 🟢 Green |
| 55–79 | `CAUTION / MEDIUM RISK` | 🟡 Yellow/Orange |
| 30–54 | `HIGH RISK` | 🟠 Orange/Red |
| 0–29 | `CRITICAL RISK` | 🔴 Red |

### Explainability — Trust & Risk Factor Breakdown
Every score comes with a detailed, human-readable breakdown of:
- ✅ **Positive Trust Signals** (e.g., "Active On-Chain Record: Executed 646 transactions across 450 unique counterparties")
- ⚠️ **Risk & Threat Factors** (e.g., "Unverified Smart Contract: Source code is NOT publicly verified on Etherscan")

---

## 2.3 🤖 AI-Powered Security Assistant — Nvidia Nemotron

ReputeX integrates a **conversational AI security consultant** powered by:

- **Primary Model**: Nvidia Nemotron 3.5 Lightning (via OpenRouter)
- **Fallback Models**: Google Gemma 2 9B, Qwen 2.5 72B, Meta Llama 3.3 70B, Nvidia Nemotron 3 Ultra 550B

### AI Capabilities:
1. **Plain-English Risk Synthesis**: Translates complex on-chain metrics into actionable security recommendations
   > *"Wallet age of 106 days and 646 transactions indicate a low risk profile. Recommendation: Always inspect transaction parameters prior to signing contract approvals."*
2. **Interactive Q&A**: Users can ask natural-language questions about any wallet:
   - "Is this wallet safe?"
   - "Why is this suspicious?"
   - "Are there risky connections?"
   - Custom free-form questions
3. **Quick Preset Chips**: One-click question buttons for instant AI analysis

---

## 2.4 🛡️ Smart Contract Verification

For Ethereum/EVM addresses that are smart contracts:
- ReputeX queries the **Etherscan ABI API** in real-time
- **Verified contracts** (open-source, auditable code) earn a **+12 trust boost**
- **Unverified contracts** (closed-source, potentially malicious) trigger a **−20 risk penalty** and display a prominent alert banner

This is critical because unverified smart contracts are the #1 vector for wallet drainer scams, honeypot tokens, and rug pulls.

---

## 2.5 🚩 Community Threat Reporting System

Users can **crowdsource security intelligence** by reporting malicious addresses directly from the extension popup:

- **Report Categories**: Phishing, Wallet Drainer, Rug Pull, Impersonation, Other
- **Description Field**: Free-form text for context and evidence
- Reports are stored in **Supabase PostgreSQL** (`public.reports` table)
- The scoring engine **dynamically queries** the reports database and penalizes flagged addresses in real-time

This creates a **decentralized, community-driven threat intelligence network**.

---

## 2.6 💰 Live Market Valuation — CoinGecko Integration

ReputeX fetches **real-time cryptocurrency prices** from the CoinGecko API:

| Asset | Symbol |
|:--|:--|
| Bitcoin | BTC |
| Ethereum | ETH |
| Solana | SOL |
| Cardano | ADA |
| Polkadot | DOT |
| XRP | XRP |
| Binance Coin | BNB |

- Automatically calculates **real-time USD balances** and **transacted volumes**
- **5-minute memory caching** to minimize API calls and maximize performance
- Displayed prominently in the 6-metric grid and entity classification

---

## 2.7 🏷️ Wallet Type Classification Engine

ReputeX predicts the **likely entity type** of every wallet using behavioral analytics:

| Entity Type | Detection Signals |
|:--|:--|
| Personal Wallet | Low-moderate tx count, few protocols |
| Exchange | High tx count, massive volume, known addresses |
| Merchant | Regular incoming payments, consistent patterns |
| Whale | Extremely high balance and volume |
| Mining Pool | Specific transaction patterns |
| Payment Processor | High throughput, uniform transaction sizes |
| Bot | Rapid-fire transactions, MEV patterns |
| Mixer | Interactions with Tornado Cash, ChipMixer |
| Possible Scam | Drainer patterns, flagged counterparties |

Results are displayed as a **visual probability distribution** with colored progress bars.

---

## 2.8 🎨 Premium Dark Glassmorphism UI

### Extension Popup — 4-Tab Layout
| Tab | Content |
|:--|:--|
| 📊 **Score** | Reputation dial, risk level badge, chain indicator, entity classification bars, 6-metric mini grid |
| 🔍 **Details** | Smart contract verification pill, XAI trust/risk factor lists with glassmorphism scrollbars, Nvidia AI synthesis card, threat report button |
| 💬 **AI Chat** | Interactive AI security consultant with quick-chip presets and scrollable response area |
| 📋 **History** | Persistent local scan log (last 25 scans) with one-click re-scan and clear button |

### Webpage Hover Card Overlay
- Clicking any inline address badge opens a **floating dark-mode card** directly on the webpage
- Displays: score dial, chain badge, 6-metric grid, entity bars, trust factors, risk flags, embedded AI chat
- Designed to never leave the page — everything happens inline

### Design System
- Dark glassmorphism aesthetic with backdrop-blur effects
- Color-coded network badges: ETH (Blue), BTC (Gold), SOL (Purple), ADA (Cyan), DOT (Pink), XRP (Green)
- Custom scrollbars with glassmorphism styling
- Zero-clipping guarantee with bounded max-heights and word-break wrapping
- Responsive layout that adapts to content length

---

## 2.9 📋 Local Scan History

- All scanned addresses are **automatically saved** to `chrome.storage.local`
- Last 25 scans preserved across browser sessions
- One-click re-scan to check updated reputation
- Clear history button for privacy
- No external data transmission — history stays local on the user's machine

---

## 2.10 🌐 Cross-Browser Compatibility

ReputeX ships optimized builds for **every major browser**:

| Browser | Build | Engine |
|:--|:--|:--|
| Google Chrome | Manifest V3 | Chromium/Blink |
| Microsoft Edge | Manifest V3 | Chromium/Blink |
| Mozilla Firefox | Manifest V3 (Gecko) | Gecko |
| Firefox Android | Manifest V3 (Gecko Android) | Gecko Mobile |
| Opera | Manifest V3 | Chromium/Blink |
| Brave | Manifest V3 | Chromium/Blink |

All packages use **POSIX forward-slash archives** to satisfy strict Chrome Web Store and Mozilla AMO automated validators.

---

# 3. COMPLETE TECHNOLOGY STACK

## 3.1 Frontend — Browser Extension

| Technology | Purpose |
|:--|:--|
| **Manifest V3** | Latest Chrome Extension standard with service workers |
| **Vanilla JavaScript (ES6+)** | Zero-dependency content scripts and popup logic |
| **CSS3 with Glassmorphism** | Dark theme with backdrop-blur, custom scrollbars, animations |
| **Chrome Extension APIs** | `chrome.runtime`, `chrome.storage.local`, `chrome.tabs` |
| **MutationObserver API** | Dynamic SPA content detection with debouncing |
| **DOM TreeWalker API** | High-performance read-only text node scanning |

## 3.2 Backend — Serverless API

| Technology | Purpose |
|:--|:--|
| **Node.js** | Server runtime |
| **Express.js** | HTTP routing and middleware |
| **Vercel Serverless Functions** | Zero-config deployment, auto-scaling, global CDN |
| **CORS Middleware** | Cross-origin request handling for extension communication |
| **dotenv** | Environment variable management |

## 3.3 Database & Storage

| Technology | Purpose |
|:--|:--|
| **Supabase PostgreSQL** | Cloud-hosted relational database for threat reports and watchlists |
| **pg (node-postgres)** | PostgreSQL client with connection pooling |
| **Supabase Pooler** | Enterprise connection pooling with SSL encryption |
| **chrome.storage.local** | Client-side scan history persistence |

## 3.4 External APIs & Data Sources

| API | Purpose | Data Retrieved |
|:--|:--|:--|
| **Etherscan API** | EVM blockchain data | Transaction history, ABI verification, contract metadata |
| **Blockstream Esplora API** | Bitcoin blockchain data | BTC transactions, UTXO balances, address history |
| **Koios REST API** | Cardano blockchain data | ADA stake addresses, transaction history, pool info |
| **Ripple Data API / XRPL** | XRP Ledger data | XRP account info, payment history |
| **Subscan API** | Polkadot/Substrate data | DOT transactions, staking info |
| **CoinGecko API** | Real-time crypto prices | USD prices for BTC, ETH, SOL, ADA, DOT, XRP, BNB |
| **OpenRouter API** | AI model gateway | Multi-model AI inference (Nemotron, Gemma, Qwen, Llama) |

## 3.5 AI / Machine Learning Stack

| Technology | Purpose |
|:--|:--|
| **Nvidia Nemotron 3.5 Lightning** | Primary AI model for security synthesis and conversational Q&A |
| **Google Gemma 2 9B IT** | Fallback AI model |
| **Qwen 2.5 72B Instruct** | Fallback AI model |
| **Meta Llama 3.3 70B Instruct** | Fallback AI model |
| **Nvidia Nemotron 3 Ultra 550B** | Fallback AI model (largest) |
| **OpenRouter Multi-Model Gateway** | Automatic model routing and failover |
| **Custom XAI Scoring Engine** | Deterministic multi-factor continuous mathematical scoring |
| **SHA-256 Cryptographic Entropy** | Address-specific micro-variance for unique score generation |

## 3.6 DevOps & Infrastructure

| Technology | Purpose |
|:--|:--|
| **Vercel** | Serverless hosting with global CDN and auto-scaling |
| **Supabase** | Managed PostgreSQL, auth, and API gateway |
| **GitHub Actions** | CI/CD pipeline for containerization and deployment |
| **Docker** | Backend containerization |
| **Kubernetes (K8s)** | Container orchestration manifests |
| **Python Build Scripts** | POSIX-compliant zip packaging for browser stores |
| **Git** | Version control with feature branching |

---

# 4. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Content.js   │    │  Popup UI    │    │  Service Worker  │  │
│  │  DOM Scanner  │◄──►│  4-Tab Dark  │◄──►│  Background API  │  │
│  │  + Hover Card │    │  Glassmorphism│    │  Router & Cache  │  │
│  └──────┬───────┘    └──────────────┘    └────────┬─────────┘  │
│         │                                          │            │
└─────────┼──────────────────────────────────────────┼────────────┘
          │                                          │
          │              HTTPS/TLS                   │
          │                                          │
┌─────────┴──────────────────────────────────────────┴────────────┐
│                    VERCEL SERVERLESS BACKEND                     │
│                                                                  │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Express.js │  │ Data Aggregator │  │   XAI Scoring Engine │  │
│  │ API Router │──│ Multi-Chain     │──│   Continuous Curves  │  │
│  │ + CORS     │  │ Data Fetcher    │  │   + AI Synthesis     │  │
│  └────────────┘  └────────┬────────┘  └──────────┬───────────┘  │
│                           │                       │              │
└───────────────────────────┼───────────────────────┼──────────────┘
                            │                       │
          ┌─────────────────┼───────────────────────┼──────────┐
          │                 │                       │          │
    ┌─────┴─────┐  ┌───────┴───────┐  ┌───────────┴─────┐  ┌──────────┐
    │ Etherscan │  │  Blockstream  │  │   OpenRouter    │  │ Supabase │
    │ + Koios   │  │  Esplora +    │  │   AI Gateway    │  │ Postgres │
    │ + Subscan │  │  CoinGecko    │  │   (Nemotron)    │  │ (Reports)│
    │ + XRPL    │  │               │  │                 │  │          │
    └───────────┘  └───────────────┘  └─────────────────┘  └──────────┘
```

---

# 5. COMPETITIVE ADVANTAGE — ReputeX vs. Traditional Methods

## 5.1 The Current (Broken) Workflow

| Step | Traditional Method | Time Required |
|:--|:--|:--|
| 1 | See wallet address on Twitter/Discord | — |
| 2 | Manually select and copy the address | ~3 seconds |
| 3 | Open a new browser tab | ~2 seconds |
| 4 | Navigate to Etherscan/Blockchain.com/Solscan | ~3 seconds |
| 5 | Paste address into search box | ~2 seconds |
| 6 | Wait for results to load | ~5 seconds |
| 7 | Manually interpret raw transaction data | ~30-120 seconds |
| 8 | Cross-reference with scam databases | ~30 seconds |
| 9 | Check smart contract verification status | ~15 seconds |
| **TOTAL per address** | | **~90-180 seconds** |

**For 10 addresses on a single page, this takes 15-30 minutes of manual work.**

## 5.2 The ReputeX Workflow

| Step | ReputeX Method | Time Required |
|:--|:--|:--|
| 1 | Open any webpage with wallet addresses | — |
| 2 | ReputeX automatically detects and scores ALL addresses | **~2-3 seconds (total)** |
| 3 | Click any badge for detailed analysis | **Instant** |
| **TOTAL for ALL addresses on a page** | | **~3 seconds** |

### Efficiency Gain: **30x to 100x faster than manual checking**

## 5.3 Feature Comparison

| Feature | Etherscan | Blockchain.com | Solscan | CertiK | ReputeX |
|:--|:--|:--|:--|:--|:--|
| Multi-chain support | ❌ EVM only | ❌ BTC only | ❌ SOL only | ✅ | ✅ 6 chains + ENS |
| Auto-detection on any webpage | ❌ | ❌ | ❌ | ❌ | ✅ |
| Inline risk scoring | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI-powered analysis | ❌ | ❌ | ❌ | Partial | ✅ Nemotron AI |
| Smart contract verification | ✅ | ❌ | ❌ | ✅ | ✅ |
| Community threat reporting | ❌ | ❌ | ❌ | ✅ | ✅ |
| Browser extension | ❌ | ❌ | ❌ | ❌ | ✅ |
| No copy-paste required | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-browser | N/A | N/A | N/A | N/A | ✅ 6 browsers |
| Free to use | ✅ | ✅ | ✅ | ❌ Paid | ✅ |

---

# 6. USE CASES & TARGET AUDIENCES

## 6.1 Individual Crypto Users
- **Scenario**: A user is browsing Twitter/X and sees someone sharing their wallet address for tips or payments
- **ReputeX**: Instantly shows a green "Safe" or red "Risk" badge next to the address without any manual action
- **Value**: Prevents sending funds to scam addresses

## 6.2 DeFi Traders & Yield Farmers
- **Scenario**: A DeFi trader is evaluating a new protocol and sees contract addresses on the project's website
- **ReputeX**: Automatically checks smart contract verification status and flags unverified contracts
- **Value**: Prevents interaction with honeypot tokens and rug pull contracts

## 6.3 NFT Collectors
- **Scenario**: An NFT buyer is browsing OpenSea and encounters creator wallet addresses
- **ReputeX**: Shows creator wallet reputation, transaction history, and community reports
- **Value**: Identifies fake/impersonator collections before purchasing

## 6.4 Crypto Journalists & Researchers
- **Scenario**: A blockchain researcher is investigating on-chain activity across multiple wallets
- **ReputeX**: Batch-scans all addresses on a page simultaneously with AI-generated summaries
- **Value**: Dramatically accelerates on-chain research and due diligence

## 6.5 Exchange Compliance Teams
- **Scenario**: A compliance officer is reviewing customer deposit/withdrawal addresses
- **ReputeX API**: Programmatic batch analysis endpoint for integrating into compliance workflows
- **Value**: Automated KYC/AML address screening at scale

## 6.6 Web3 Project Teams
- **Scenario**: A project team wants to verify that addresses shared in their community Discord are legitimate
- **ReputeX**: Community members can use the extension to instantly verify any address shared in chat
- **Value**: Protects community from impersonation and phishing attacks

---

# 7. API REFERENCE — FOR DEVELOPERS

Base URL: `https://repute-x-iota.vercel.app/api/reputation`

| Method | Endpoint | Description |
|:--|:--|:--|
| `GET` | `/health` | Server status and health check |
| `POST` | `/analyze` | Complete multi-chain analysis for a single address |
| `POST` | `/batch` | High-speed batch reputation scan for multiple addresses |
| `POST` | `/chat` | Contextual Q&A with Nemotron AI consultant |
| `GET` | `/prices` | Cached real-time crypto prices from CoinGecko |
| `POST` | `/report` | Submit community threat report to Supabase DB |
| `GET` | `/reports/:address` | Fetch existing community threat reports for an address |
| `POST` | `/watchlist` | Add an address to user watchlist |
| `GET` | `/watchlist/:clientId` | Retrieve saved watchlist for a client |
| `DELETE` | `/watchlist/:id` | Remove an address from watchlist |

### Example: Single Address Analysis
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
```

### Example: Batch Analysis
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/batch \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["vitalik.eth", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]}'
```

### Example: AI Chat
```bash
curl -X POST https://repute-x-iota.vercel.app/api/reputation/chat \
  -H "Content-Type: application/json" \
  -d '{"address": "0xd8dA...", "question": "Is this wallet safe?", "context": {...}}'
```

---

# 8. COMPATIBLE WALLETS & ADDRESSES

ReputeX is **wallet-agnostic** — it doesn't connect to wallets. Instead, it analyzes any wallet **address** it finds on a webpage. This means it works with addresses from:

### Hardware Wallets
- Ledger Nano S/X/S Plus
- Trezor Model T/One/Safe 3
- KeepKey
- GridPlus Lattice1

### Software Wallets
- MetaMask (ETH/EVM)
- Phantom (SOL)
- Rabby (Multi-chain)
- Coinbase Wallet
- Trust Wallet
- Exodus
- Atomic Wallet
- Keplr (Cosmos)

### Exchange Wallets
- Binance
- Coinbase
- Kraken
- OKX
- Bybit
- KuCoin

### Any Address Format
If it's a valid blockchain address on one of the 6 supported chains, ReputeX will detect and analyze it — regardless of which wallet software generated it.

---

# 9. SECURITY & PRIVACY

## Privacy-First Architecture

| Commitment | Implementation |
|:--|:--|
| **No Private Keys** | ReputeX never requests or accesses private keys, seed phrases, or wallet signatures |
| **Zero Injections** | Content scripts operate in isolated worlds; no external third-party scripts injected |
| **Safe DOM APIs** | Exclusively uses `textContent` and `createElement` (no `innerHTML`) to eliminate XSS |
| **Encrypted Communication** | All external requests over TLS/HTTPS |
| **Local History** | Scan history stored only in `chrome.storage.local` on the user's machine |
| **Read-Only Scanning** | Extension only reads text from pages; never modifies forms, inputs, or page behavior |
| **No Tracking** | No analytics, telemetry, or user tracking of any kind |

---

# 10. PROJECT FILE STRUCTURE

```
ReputeX/
├── index.html                               # Landing page
├── vercel.json                              # Vercel serverless routing & CORS
├── docker-compose.yml                       # Docker service configuration
├── scripts/
│   └── build_posix_zips.py                  # Cross-browser POSIX packaging
├── supabase/
│   ├── config.toml                          # Supabase configuration
│   └── migrations/
│       └── 20260903000000_init_reputex.sql  # PostgreSQL schema
├── k8s/                                     # Kubernetes deployment manifests
├── backend/
│   ├── server.js                            # Express API Server & routes
│   ├── services/
│   │   ├── dbService.js                     # Supabase pg.Pool client
│   │   └── dataAggregator.js                # Multi-chain data fetcher
│   ├── engine/
│   │   └── xaiEngine.js                     # XAI scoring engine + AI
│   └── data/
│       └── scamDatabase.json                # Local threat registry
├── extension/                               # Chromium builds
│   ├── manifest.json                        # Manifest V3 (v2.1.0)
│   ├── background/service_worker.js         # Background worker
│   ├── content/
│   │   ├── content.js                       # DOM scanner & hover overlay
│   │   └── content.css                      # Badge & hover card styles
│   ├── popup/
│   │   ├── popup.html                       # Tabbed popup interface
│   │   ├── popup.js                         # Popup controller logic
│   │   └── popup.css                        # Glassmorphism theme
│   └── icons/                               # App icons (16, 48, 128px)
├── extension-firefox/                       # Firefox build
│   └── manifest.json                        # Gecko MV3 manifest
├── demo/
│   └── demo.html                            # Multi-chain test page
└── api/                                     # Vercel serverless functions
```

---

# 11. PRODUCT METRICS & SCORING EXAMPLES

| Wallet | Description | ReputeX Score | Risk Level |
|:--|:--|:--|:--|
| `vitalik.eth` | Ethereum co-founder, massive tx history | **100** | 🟢 TRUSTED |
| Satoshi Genesis BTC | Bitcoin genesis address, iconic wallet | **100** | 🟢 TRUSTED |
| Active DeFi User | 2+ years, 500+ txs, multi-protocol | **91** | 🟢 LOW RISK |
| Casual User | 6 months, 50 txs, single chain | **61** | 🟡 CAUTION |
| Dormant Wallet | 1 year, 5 txs, minimal activity | **56** | 🟡 CAUTION |
| Known Scam Drainer | Flagged in scam database | **0** | 🔴 CRITICAL |

---

# 12. FUTURE ROADMAP

| Feature | Status | Description |
|:--|:--|:--|
| Browser Store Publication | In Progress | Chrome Web Store, Firefox AMO, Edge Add-ons |
| Transaction Simulation | Planned | Pre-sign transaction risk preview |
| Watchlist Push Notifications | Planned | Real-time alerts when watched addresses make transactions |
| Graph Visualization | Planned | Interactive network visualization of wallet connections |
| Mobile App | Planned | Standalone iOS/Android wallet scanner |
| DAO Governance Integration | Planned | Reputation-weighted voting for flagged addresses |
| Multi-language Support | Planned | Localization for global markets |

---

# 13. HIGHLIGHTED AI FEATURES — SUMMARY

1. **🤖 Nvidia Nemotron 3.5 Lightning AI Synthesis** — Generates plain-English security summaries from raw on-chain data
2. **💬 Interactive AI Chat Assistant** — Users can ask any question about any wallet and receive contextual AI-powered answers
3. **🧠 Multi-Model Failover** — 5 AI models (Nemotron → Gemma → Qwen → Llama → Nemotron Ultra) ensure 99.9% availability
4. **🏷️ Wallet Type Classification** — AI-powered behavioral analytics predicts entity type probabilities
5. **📊 Continuous Mathematical Scoring** — Logarithmic, square-root, and power curves eliminate score clustering
6. **🔐 Cryptographic Entropy Dispersion** — SHA-256 hash-based micro-variance ensures every address gets a unique score
7. **📝 Explainable Factor Breakdown** — Every score accompanied by detailed human-readable trust/risk signals

---

# 14. KEY STATISTICS FOR PRESENTATION

- **6 Blockchains + ENS** supported natively
- **6 Browsers** compatible (Chrome, Edge, Firefox, Opera, Brave, Firefox Android)
- **5 AI Models** with automatic failover
- **7 Blockchain APIs** for real-time on-chain data
- **10 API Endpoints** for developer integration
- **0 Private Keys** ever requested or accessed
- **100% Free** to use
- **30x-100x Faster** than manual wallet checking
- **Version 2.1.0** — Actively developed and maintained

---

# 15. CALL TO ACTION

> **ReputeX makes Web3 safer for everyone — one address at a time.**
>
> Install the extension, browse the web, and let ReputeX automatically protect you from scam wallets, unverified contracts, and malicious addresses across 6 blockchains.
>
> **GitHub**: [github.com/Aru-D-Rizz/ReputeX](https://github.com/Aru-D-Rizz/ReputeX)
> **Live Demo**: [repute-x-iota.vercel.app](https://repute-x-iota.vercel.app/)

---

*ReputeX — Explainable AI Reputation for the Decentralized Web.*
