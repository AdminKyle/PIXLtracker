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

  // Await API response before transitioning
  const status = await scanApi(barcode, currentSession.username);

  // Transition away and cleanup scanner memory
  stopScanner();
  UI.hideProcessingOverlay();
  UI.switchView('dashboard');

  if (status === 'success') {
    sessionScanCount++;
    UI.updateSessionCount(sessionScanCount);
    UI.haptic('success');
    UI.showFeedback('success', `Scanned: ${barcode}`);
  } else if (status === 'not_found') {
    UI.haptic('error');
    UI.showFeedback('error', 'Product Not Found');
  } else if (status === 'timeout') {
    UI.haptic('error');
    UI.showFeedback('error', 'Request Timed Out');
  } else {
    UI.haptic('error');
    UI.showFeedback('error', 'Network Error');
  }
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
