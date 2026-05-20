import { initAuth, logout } from './auth.js';
import { UI } from './ui.js';
import { scanApi } from './api.js';
import { initScanner, startScanner, stopScanner } from './scanner.js';

let currentSession = null;
let sessionScanCount = 0;
let deferredInstallPrompt = null;

// PWA Install Handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// Offline/Online Handling
window.addEventListener('offline', () => UI.setOfflineIndicator(true));
window.addEventListener('online', () => UI.setOfflineIndicator(false));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/PIXLtracker/service-worker.js')
      .then(reg => console.log('SW registered', reg.scope))
      .catch(err => console.error('SW registration failed', err));
  });
}

function handleLoginSuccess(sessionData) {
  currentSession = sessionData;
  UI.updateDashboard(currentSession);
  UI.updateSessionCount(sessionScanCount);
  UI.switchView('dashboard');

  // Trigger install prompt after successful login if available
  if (deferredInstallPrompt) {
    setTimeout(() => UI.showInstallPrompt(deferredInstallPrompt), 2000);
  }
}

async function handleBarcodeDetected(barcode) {
  if (!barcode) {
    // Cancelled manually
    UI.switchView('dashboard');
    return;
  }

  // Processing State UX
  UI.haptic('processing');
  UI.showProcessingOverlay();
  
  if (!navigator.onLine) {
    stopScanner();
    UI.hideProcessingOverlay();
    UI.switchView('dashboard');
    UI.haptic('error');
    UI.showFeedback('error', 'Device Offline');
    return;
  }

  // Hold the UI for exactly 350ms to provide a satisfying visual "scan lock" effect
  await new Promise(r => setTimeout(r, 350));

  // Transition away IMMEDIATELY for zero-friction perceived speed
  UI.hideProcessingOverlay();
  UI.switchView('dashboard');
  
  setTimeout(() => {
    stopScanner();
  }, 50);

  // Optimistic UI Update: Assume success immediately so the user can keep moving
  sessionScanCount++;
  UI.updateSessionCount(sessionScanCount);

  // Fire API request in the background
  scanApi(barcode, currentSession.username).then(status => {
    if (status === 'success') {
      UI.haptic('success');
      UI.showFeedback('success', `Logged: ${barcode}`);
    } else {
      // Revert optimistic update on failure
      sessionScanCount--;
      UI.updateSessionCount(sessionScanCount);
      
      UI.haptic('error');
      let errorMsg = 'Network Error';
      if (status === 'not_found') errorMsg = 'Product Not Found';
      if (status === 'timeout') errorMsg = 'Request Timed Out';
      UI.showFeedback('error', `Failed: ${barcode} (${errorMsg})`);
    }
  });
}

function setupEventHandlers() {
  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('main-scan-btn').addEventListener('click', () => {
    UI.switchView('scanner');
    startScanner(handleBarcodeDetected);
  });
}

async function initApp() {
  setupEventHandlers();
  if (!navigator.onLine) UI.setOfflineIndicator(true);
  
  await initScanner(handleBarcodeDetected);
  initAuth(handleLoginSuccess);
}

document.addEventListener('DOMContentLoaded', initApp);
