# ReputeX: Real-Time Web3 Blockchain Wallet Reputation & Risk Assessment

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-6366f1.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Vercel Deployment](https://img.shields.io/badge/API_Backend-Vercel_Serverless-10b981.svg)](https://repute-x-iota.vercel.app/)
[![Nvidia Nemotron 3 Ultra](https://img.shields.io/badge/OpenRouter_AI-Nvidia_Nemotron_3_Ultra_550B-c084fc.svg)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ReputeX** is a browser extension and explainable AI (XAI) security platform that automatically scans web pages for crypto wallet addresses (Ethereum EVM, Bitcoin, Solana, and ENS domains), highlights them in real time, and evaluates their reputation, entity classification, and risk profile.

---

## 📥 How to Download & Install the Extension

You do **not** need to install Node.js or run local servers to use the extension. The extension is pre-configured to connect directly to the live hosted Vercel API backend (`https://repute-x-iota.vercel.app/`).

### Step 1: Download the Extension Code
Choose one of the following methods to download the project:

- **Method A (Direct ZIP Download)**:
  1. Click **[Download ReputeX ZIP](https://github.com/Aru-D-Rizz/ReputeX/archive/refs/heads/main.zip)**.
  2. Extract the downloaded `ReputeX-main.zip` file onto your computer (e.g., your Desktop or Downloads folder).

- **Method B (Git Clone)**:
  ```bash
  git clone https://github.com/Aru-D-Rizz/ReputeX.git
  ```

---

### Step 2: Load Extension into Browser (Chrome / Edge / Brave)

1. Open your browser and navigate to the extensions management page:
   - **Google Chrome**: Go to `chrome://extensions`
   - **Microsoft Edge**: Go to `edge://extensions`
   - **Brave Browser**: Go to `brave://extensions`
2. Enable **Developer mode** using the toggle switch in the **top-right corner**.
3. Click the **Load unpacked** button in the **top-left corner**.
4. Browse to your extracted `ReputeX` folder and select the **`extension`** folder (`ReputeX/extension`).

> 🎉 **Done!** The ReputeX extension icon ⚡ will now appear in your browser toolbar.

---

### Step 3: Test & Verify the Extension

1. Open the live interactive demo page: **[https://repute-x-iota.vercel.app/demo/demo.html](https://repute-x-iota.vercel.app/demo/demo.html)** (or open `demo/demo.html` locally).
2. All Bitcoin, Ethereum, and Solana addresses on the page will automatically be highlighted with high-visibility badges.
3. Click or hover over any address badge to view its **0–100 Reputation Score**, **Likely Wallet Type Classification**, and ask questions to the **Nemotron AI Chat Assistant**!

---

## 🚀 Key Features

- **⚡ Automatic Multi-Chain Address Scanner**:
  - Automatically detects EVM (`0x...`), Bitcoin (`1...`, `3...`, `bc1q...`, `bc1p...`), Solana (`Base58`), and ENS (`.eth`, `.org`) domain addresses across Web3 sites (Etherscan, Blockstream Explorer, Twitter / X, OpenSea, GitHub).
  - Non-destructive, read-only webpage DOM parsing complying with strict site Content Security Policies (CSP).

- **🧠 OpenRouter Nvidia Nemotron 3 Ultra XAI Risk Engine**:
  - Powered by **OpenRouter API** using **`nvidia/nemotron-3-ultra-550b-a55b:free`**.
  - Combines deterministic threat intelligence databases, live on-chain metrics, 1-hop & 2-hop graph proximity scores, and 550B parameter AI synthesis.
  - Scores wallets on a 0–100 reputation scale with clear risk categories:
    - **`LOW RISK`** (80–100)
    - **`MEDIUM RISK`** (55–79)
    - **`HIGH RISK`** (30–54)
    - **`CRITICAL RISK`** (0–29)

- **🏷️ Likely Wallet Type Classification**:
  - Predicts entity classifications with percentage distributions across 10+ categories:
    `Exchange`, `Personal wallet`, `Whale`, `Mining wallet`, `Merchant`, `Bot`, `Payment processor`, `Dormant wallet`, `Mixer`, `Possible scam wallet`.

- **💬 Interactive Natural Language AI Chat Assistant**:
  - Built-in chat box available inside both the extension popup UI and the floating webpage hover card overlay.
  - Ask natural language questions like:
    - *"Is this wallet safe?"*
    - *"Why is this wallet suspicious?"*
    - *"Has this wallet interacted with any risky addresses?"*

- **🔒 Manifest V3 & Security Standard Compliance**:
  - Strictly adheres to Manifest V3 requirements.
  - Read-only DOM node traversal using `textContent` and `createElement` DOM APIs (0 `innerHTML` XSS risks).
  - Enforces encrypted `https://` protocols for all external API endpoints.

---

## 🛠️ Project Structure

```text
ReputeX/
├── index.html                         # Official Vercel landing page
├── vercel.json                        # Vercel Serverless Function & CORS routing configuration
├── backend/
│   ├── data/
│   │   └── scamDatabase.json          # Offline scam & verified entity registry
│   ├── engine/
│   │   └── xaiEngine.js               # OpenRouter Nvidia Nemotron 3 Ultra XAI engine & Q&A assistant
│   ├── services/
│   │   └── dataAggregator.js          # Live Etherscan V2 & Blockstream Esplora data fetcher
│   └── server.js                      # Express API Server
├── extension/
│   ├── background/
│   │   └── service_worker.js          # MV3 service worker, checksum validation & API router
│   ├── content/
│   │   ├── content.js                 # Read-only page scanner & hover overlay card builder
│   │   └── content.css                # High-visibility inline address pill & overlay card styles
│   ├── icons/                         # Extension toolbar PNG icons (16x16, 48x48, 128x128)
│   ├── popup/
│   │   ├── popup.html                 # Extension popup interface
│   │   ├── popup.js                   # Popup logic, wallet list & AI chatbox controller
│   │   └── popup.css                  # Dark glassmorphism popup styling
│   └── manifest.json                  # Manifest V3 extension configuration
└── demo/
    └── demo.html                      # Web3 test environment (Etherscan, BTC, Twitter, OpenSea)
```

---

## ⚙️ Optional Local Backend Setup (For Developers)

If you wish to run the API backend locally on your own machine instead of using the hosted Vercel API:

```bash
# 1. Navigate to backend folder & install dependencies
cd backend
npm install

# 2. Configure .env credentials (or copy from .env.example)
cp .env.example .env

# 3. Start local API server on Port 5000
node server.js
```
The local server starts running on `http://localhost:5000`:
- **Health Check**: `GET http://localhost:5000/health`
- **Single Wallet Analysis**: `POST http://localhost:5000/api/reputation/analyze`
- **Natural Language Q&A Chat**: `POST http://localhost:5000/api/reputation/chat`

---

## 📡 API Reference

### 1. Analyze Wallet Reputation
**`POST /api/reputation/analyze`**
```json
// Request Body
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}

// Response
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "score": 100,
  "riskCategory": "LOW",
  "riskLevel": "TRUSTED",
  "ens": "vitalik.eth",
  "classification": [
    { "type": "Whale", "pct": 35 },
    { "type": "Exchange", "pct": 27 },
    { "type": "Payment processor", "pct": 14 },
    { "type": "Other", "pct": 24 }
  ],
  "metrics": {
    "walletAgeDays": 1450,
    "totalTxCount": 8420,
    "scamReportCount": 0,
    "maliciousProximityScore": 0
  },
  "explanation": {
    "positiveFactors": [...],
    "negativeFactors": [...],
    "aiSynthesis": {
      "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
      "provider": "Nvidia Nemotron 3 Ultra (via OpenRouter)",
      "summary": "Wallet age of 1450 days and 8420 transactions indicate a trusted profile.",
      "recommendation": "Always inspect contract parameters prior to signing."
    }
  }
}
```

### 2. Natural Language AI Chat Assistant
**`POST /api/reputation/chat`**
```json
// Request Body
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "question": "Is this wallet safe?"
}

// Response
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "question": "Is this wallet safe?",
  "answer": "Yes, this wallet is exceptionally safe. It holds a perfect 100/100 reputation score with a LOW risk classification, zero risky counterparties, and a 0/100 malicious proximity index across both 1-hop and 2-hop connections.",
  "score": 100,
  "riskCategory": "LOW"
}
```

---

## 🔒 Security & Privacy

- **No Private Key Access**: ReputeX only reads public wallet addresses displayed on web pages.
- **Read-Only Scanner**: Uses safe DOM text node extraction without modifying page behavior or injecting unverified scripts.
- **Cryptographic Validation**: Validates EVM EIP-55, Bitcoin Bech32/P2SH, and Solana Base58 checksum formats to prevent false positive lookups.

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.
