# PIXL Tracker

A high-speed vape inventory barcode scanning system optimized for real-world retail and warehouse operations.

## Architecture & Technology Stack
- **Frontend**: Vanilla JavaScript (ESModules), HTML5, CSS3
- **Build Tool**: Vite (Lightning-fast dev server, optimized production builds)
- **Scanning Engine**: Native `BarcodeDetector` API with automatic seamless fallback to `@zxing/browser` (ZXing).
- **Backend**: Integrates with a Google Apps Script macro (`/exec`).
- **PWA**: Fully functional Progressive Web App with manifest, service worker for caching, and installability.

## Deployment to GitHub Pages

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Connect to GitHub**
   Create a repository named `PIXLtracker` on GitHub.
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/PIXLtracker.git
   git push -u origin main
   ```

3. **Deploy via GitHub Pages**
   You have two choices for deploying Vite apps to GitHub Pages:
   
   **Option A: Manual `gh-pages` branch (Easiest local method)**
   ```bash
   npm run build
   npx gh-pages -d dist
   ```
   
   **Option B: GitHub Actions (Recommended for production)**
   Create a `.github/workflows/deploy.yml` file with standard Vite deployment action. Then configure your repository Settings > Pages to deploy from Actions.

   *Note*: The `vite.config.js` is already pre-configured with `base: '/PIXLtracker/'` to resolve assets correctly on GH Pages.

## Core Features & Logic
- **1.5s Scan Lock**: Employs a strict 1.5-second lock preventing duplicate or rapid accidental multi-scans.
- **Hardware Agnostic**: Auto-detects device capability. Will use ultra-fast native hardware APIs where available, or a software decoder as fallback.
- **Offline Shell**: Service worker caches UI structure.

## Run Locally
```bash
npm install
npm run dev -- --host
```
*Use `--host` to expose the dev server to your local network, allowing testing on a physical mobile device.*
