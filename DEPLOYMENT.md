# ReputeX Hybrid Deployment Guide (Vercel + Kubernetes)

This guide provides step-by-step instructions for deploying **ReputeX** using a hybrid architecture:
- **Frontend / Demo Application**: Deployed on **Vercel**
- **Express XAI Engine Backend**: Containerized with **Docker** and deployed to a **Kubernetes Cluster**

---

## 🏗️ Architecture Overview

```text
  ┌────────────────────────┐              ┌────────────────────────┐
  │  Vercel Frontend App   │              │  Chrome Browser Ext.   │
  │ (https://reputex.vercel.app) │         │ (Manifest V3 Extension)│
  └───────────┬────────────┘              └───────────┬────────────┘
              │                                       │
              │  HTTPS Requests (CORS Permitted)     │
              └───────────────────┬───────────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │ NGINX Ingress Controller  │
                    │   (https://api.reputex.com) │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │ Kubernetes Cluster Service│
                    │ (reputex-backend-service) │
                    └─────────────┬─────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
            ┌────────▼───────┐        ┌────────▼───────┐
            │ Pod Replica 1  │        │ Pod Replica 2  │
            │ (reputex-api)  │        │ (reputex-api)  │
            └────────────────┘        └────────────────┘
```

---

## 📦 1. Backend Containerization

The backend utilizes a **multi-stage Dockerfile** (`backend/Dockerfile`) to ensure minimal image size, fast build caching, and security hardening (runs as a non-root system user `reputex`).

### Build & Test Locally
```bash
# Build the Docker image locally
docker build -t reputex-backend:latest ./backend

# Run the container locally mapping port 5000
docker run -d --name reputex-api -p 5000:5000 --env-file ./backend/.env reputex-backend:latest

# Verify health endpoint
curl http://localhost:5000/health
```

---

## ☸️ 2. Kubernetes Cluster Deployment

All Kubernetes manifests are located in the [`k8s/`](file:///c:/Users/Aldrid/Desktop/ReputeX/k8s) directory.

### Step 1: Create Namespace
```bash
kubectl create namespace reputex
```

### Step 2: Configure Environment & Secrets
1. Update `k8s/configmap.yaml` with your non-sensitive environment settings.
2. Update `k8s/secret.yaml` with your OpenRouter, TokenReply, and Etherscan API keys.

Apply the configuration manifests:
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

### Step 3: Deploy Backend Pods & Service
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### Step 4: Configure Ingress & SSL Certificates
Ensure NGINX Ingress Controller and `cert-manager` are installed on your cluster:
```bash
kubectl apply -f k8s/ingress.yaml
```

### Step 5: Verify Deployment Status
```bash
# Check pod rollout status
kubectl get pods -n reputex

# Check service and ingress endpoint
kubectl get svc,ingress -n reputex

# View container logs
kubectl logs -f deployment/reputex-backend -n reputex
```

---

## 🌐 3. Vercel Frontend Deployment

### Step 1: Connect GitHub Repository to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com) and click **Add New** > **Project**.
2. Import the `Aru-D-Rizz/ReputeX` repository.

### Step 2: Configure Vercel Project Settings
- **Framework Preset**: Other / None
- **Root Directory**: `./` (or leave default)
- **Output Directory**: `demo`

### Step 3: Configure Environment Variables in Vercel
Add the following Environment Variable in Vercel Project Settings:
- `NEXT_PUBLIC_API_URL`: `https://api.reputex.com/api/reputation`
- `VITE_API_URL`: `https://api.reputex.com/api/reputation`

### Step 4: Deploy & Verify
Click **Deploy**. Vercel will automatically build the application and route `/api/*` calls to your Kubernetes backend via `vercel.json`.

---

## 🚀 4. Automated CI/CD (GitHub Actions)

The repository includes a automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
1. Builds the backend Docker image on `main` branch updates.
2. Pushes tagged images to **GitHub Container Registry (GHCR)** (`ghcr.io/aru-d-rizz/reputex-backend:latest`).
3. Deploys updated manifests to your Kubernetes cluster and performs a zero-downtime rolling update.

### Setting Up GitHub Secrets
Go to **GitHub Repository** > **Settings** > **Secrets and variables** > **Actions** and add:
- `KUBE_CONFIG`: Your base64-encoded or raw `kubeconfig` file content to allow cluster deployment.

---

## 🧪 5. Testing & Verification

1. **Health Check**:
   ```bash
   curl -i https://api.reputex.com/health
   ```
2. **Single Wallet Reputation Endpoint**:
   ```bash
   curl -X POST https://api.reputex.com/api/reputation/analyze \
     -H "Content-Type: application/json" \
     -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
   ```
3. **AI Chat Assistant Endpoint**:
   ```bash
   curl -X POST https://api.reputex.com/api/reputation/chat \
     -H "Content-Type: application/json" \
     -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "question": "Is this wallet safe?"}'
   ```
