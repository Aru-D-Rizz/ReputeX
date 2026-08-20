# ReputeX Deployment Guide

This guide provides step-by-step instructions for deploying **ReputeX**:
- **Backend API & Demo Web App**: Deployed on **Vercel** (Serverless Functions)
- **Chrome Extension**: Communicates directly with your Vercel API backend out of the box!
- **Containerized Backup (Optional)**: Docker & Kubernetes manifest support included.

---

## ⚡ 1. Vercel Serverless Backend & Demo Deployment

When you import the repository into Vercel, Vercel automatically deploys both your **Express Backend API** (as Node.js Serverless Functions via `api/index.js`) and your **Demo Web App** (`demo/demo.html`).

### Step-by-Step Vercel Deployment

1. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com) > **Add New** > **Project**.
   - Select your imported GitHub repository `Aru-D-Rizz/ReputeX`.

2. **Framework & Build Settings**:
   - **Framework Preset**: `Other` (or Node.js)
   - **Root Directory**: `./` (leave default)

3. **Configure Vercel Environment Variables**:
   In Vercel Project Settings > **Environment Variables**, add the following key:
   - `OPENROUTER_API_KEY`: `YOUR_OPENROUTER_API_KEY_HERE`
   - `OPENROUTER_MODEL`: `nvidia/nemotron-3-ultra-550b-a55b:free`
   - `ETHERSCAN_API_KEY`: `CAQQYTH2TSFZ27NKWHF7W2QP3S7BYII7IB`

4. **Deploy**:
   - Click **Deploy**. Vercel will build your project and expose your live Serverless API at:
     - **Health Endpoint**: `https://your-project.vercel.app/health`
     - **Analyze Endpoint**: `https://your-project.vercel.app/api/reputation/analyze`
     - **Chat Endpoint**: `https://your-project.vercel.app/api/reputation/chat`
     - **Batch Endpoint**: `https://your-project.vercel.app/api/reputation/batch`

---

## 🧩 2. Chrome Extension Configuration

Anyone who downloads or installs your Chrome Extension can now use your live hosted Vercel backend without needing local Node.js!

- **Default Hosted URL**: `https://reputex.vercel.app/api/reputation`
- **Fallback**: Automatically falls back to `http://127.0.0.1:5000/api/reputation` if offline.

### Setting Custom Backend URL in Extension (Optional)
If your Vercel deployment URL is different (e.g., `https://reputex-v3.vercel.app`), users can open Chrome Developer Tools Console inside the extension popup and run:
```javascript
chrome.storage.local.set({ reputex_custom_api_url: "https://your-project.vercel.app/api/reputation" });
```

---

## 🐳 3. Kubernetes / Docker Deployment (Optional Alternative)

If you also wish to deploy the Express backend to a self-hosted Kubernetes cluster or Docker container:

```bash
# Build & run locally with Docker Compose
docker compose up -d --build

# Apply Kubernetes manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```
