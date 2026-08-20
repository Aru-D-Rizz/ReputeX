# Privacy Policy for ReputeX

**Effective Date:** August 20, 2026  
**Official Repository:** [https://github.com/Aru-D-Rizz/ReputeX](https://github.com/Aru-D-Rizz/ReputeX)  
**Hosted Privacy Page:** [https://repute-x-iota.vercel.app/privacy.html](https://repute-x-iota.vercel.app/privacy.html)

---

## Overview
**ReputeX** ("we", "our", or "us") is dedicated to protecting user privacy. This Privacy Policy outlines our data practices for the ReputeX browser extension and explainable AI (XAI) Web3 risk assessment engine.

---

## 1. Information We Do NOT Collect
ReputeX is engineered with a strict **privacy-first** approach:
- **No Personally Identifiable Information (PII):** We do not collect names, email addresses, phone numbers, location data, or IP addresses.
- **No Private Keys or Credentials:** ReputeX never requests, accesses, stores, or transmits private keys, seed phrases, passwords, or exchange credentials.
- **No Browsing History Tracking:** ReputeX does not track, record, analyze, or monetize your web browsing history across websites.

---

## 2. Information Processed & Stored Locally

### A. Public Blockchain Wallet Addresses
When address scanning is active, the extension processes public crypto wallet addresses (Ethereum EVM `0x...`, Bitcoin `1...`/`3...`/`bc1...`, Solana Base58, and ENS domain names) displayed on active web pages solely to evaluate reputation scores and threat signatures.

### B. Local Browser Storage (`chrome.storage.local`)
ReputeX uses local browser storage exclusively on your device to:
1. Save extension user preferences (e.g. enabling or disabling the auto-scanner).
2. Cache calculated reputation reports locally to reduce redundant network API calls and enhance response speeds.

---

## 3. Third-Party Web3 APIs & AI Services
To provide multi-chain risk scoring and conversational security assessments, ReputeX communicates over encrypted `HTTPS` connections with public Web3 endpoints:
- **Blockchain Data Providers:** Etherscan V2 API and Blockstream Esplora BTC API (for public transaction counts, wallet age, and balances).
- **OpenRouter AI / Nvidia Nemotron:** Synthesizes full context payloads into natural language security answers when you ask questions in the AI Chat Assistant.

---

## 4. Manifest V3 & Security Standards
ReputeX strictly adheres to Google Chrome and Microsoft Edge Manifest V3 security requirements:
- Uses safe, read-only DOM node extraction (`document.createElement` and `textContent`).
- Implements strict Content Security Policy (`"extension_pages": "script-src 'self'; object-src 'self';"`).
- Contains 0 remote code execution or string-based `eval()` script injections.

---

## 5. Privacy Policy Updates
We may update this Privacy Policy periodically to reflect new features or security standards. Any updates will be published to this file and the hosted privacy page.

---

## 6. Contact & Support
If you have any questions or feedback regarding this Privacy Policy, please open an issue on our official GitHub repository:
👉 **[https://github.com/Aru-D-Rizz/ReputeX/issues](https://github.com/Aru-D-Rizz/ReputeX/issues)**
