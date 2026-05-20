export const UI = {
  views: {
    login: document.getElementById('view-login'),
    dashboard: document.getElementById('view-dashboard'),
    scanner: document.getElementById('view-scanner'),
    search: document.getElementById('view-search')
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

  showSearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (results.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No flavours found';
      empty.className = 'search-item';
      resultsContainer.appendChild(empty);
      return;
    }
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.dataset.barcode = item.barcode;
      const nameSpan = document.createElement('span');
      nameSpan.className = 'search-item-name';
      nameSpan.textContent = item.name;
      const barcodeSpan = document.createElement('span');
      barcodeSpan.className = 'search-item-barcode';
      barcodeSpan.textContent = item.barcode;
      div.appendChild(nameSpan);
      div.appendChild(barcodeSpan);
      div.addEventListener('click', () => {
        // Simulate barcode detection
        UI.switchView('dashboard');
        // Call the globally defined handleBarcodeDetected (available via window)
        if (window.handleBarcodeDetected) {
          window.handleBarcodeDetected(item.barcode);
        }
      });
      resultsContainer.appendChild(div);
    });
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
