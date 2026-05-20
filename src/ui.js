export const UI = {
  views: {
    login: document.getElementById('view-login'),
    dashboard: document.getElementById('view-dashboard'),
    scanner: document.getElementById('view-scanner')
  },
  
  switchView(viewName) {
    Object.values(this.views).forEach(v => {
      v.classList.remove('active');
      v.classList.add('hidden');
    });
    
    if (this.views[viewName]) {
      this.views[viewName].classList.remove('hidden');
      setTimeout(() => {
        this.views[viewName].classList.add('active');
      }, 10);
    }
  },

  updateDashboard(session) {
    document.getElementById('greeting-text').textContent = `Hello, ${session.username}`;
    document.getElementById('assigned-stock').textContent = session.assignedStock;
  },

  updateSessionCount(count) {
    document.getElementById('session-count').textContent = count;
  },

  haptic(type) {
    if (!navigator.vibrate) return;
    if (type === 'success') {
      navigator.vibrate([30, 50, 30]);
    } else if (type === 'error') {
      navigator.vibrate([50, 100, 50, 100, 50]);
    } else if (type === 'processing') {
      navigator.vibrate([20]); // soft tick to acknowledge read
    }
  },

  showProcessingOverlay() {
    document.getElementById('scanner-processing').classList.remove('hidden');
  },

  hideProcessingOverlay() {
    document.getElementById('scanner-processing').classList.add('hidden');
  },

  showFeedback(type, message) {
    const card = document.getElementById('latest-scan-feedback');
    card.className = `feedback-card ${type}`;
    card.textContent = message;
    
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = null;
    
    card.classList.remove('hidden');

    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      card.classList.add('hidden');
    }, 3500);
  },

  setOfflineIndicator(isOffline) {
    const el = document.getElementById('offline-indicator');
    if (isOffline) el.classList.remove('hidden');
    else el.classList.add('hidden');
  },

  showInstallPrompt(deferredPrompt) {
    const banner = document.getElementById('install-banner');
    banner.classList.remove('hidden');
    
    document.getElementById('install-btn').onclick = async () => {
      banner.classList.add('hidden');
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    };
    
    document.getElementById('install-dismiss').onclick = () => {
      banner.classList.add('hidden');
    };
  }
};
