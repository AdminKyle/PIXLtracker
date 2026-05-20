import { BrowserMultiFormatReader } from '@zxing/browser';

const videoEl = document.getElementById('scanner-video');
let stream = null;
let scanLock = false;
let scannerInterval = null;
let zxingReader = null;
let useNativeDetector = false;
let nativeDetector = null;
let isScanningActive = false;
let onDetectedCallback = null;

// Camera lifecycle management
document.addEventListener('visibilitychange', () => {
  const visible = document.visibilityState === 'visible';
  if (!visible && isScanningActive) {
    stopScannerHardwareOnly();
  } else if (visible && isScanningActive && !stream) {
    startScanner(onDetectedCallback);
  }
});

export async function initScanner(onDetected) {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.length > 0) {
        // V1 Explicit format mapping. Apple Webkit breaks with empty format arrays.
        nativeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
        useNativeDetector = true;
      }
    } catch (e) {
      console.warn("Native init failed", e);
    }
  }

  if (!useNativeDetector) {
    zxingReader = new BrowserMultiFormatReader();
  }

  document.getElementById('close-scanner-btn').addEventListener('click', () => {
    isScanningActive = false;
    stopScannerHardwareOnly();
    onDetected(null);
  });
}

export async function startScanner(onDetected) {
  scanLock = false;
  isScanningActive = true;
  onDetectedCallback = onDetected;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    
    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', 'true');
    
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play().then(resolve).catch(resolve);
      };
      if (videoEl.readyState >= 1) resolve();
    });

    if (useNativeDetector) {
      startNativeDetection();
    } else {
      startZXingDetection();
    }
  } catch (error) {
    isScanningActive = false;
    alert("Camera unavailable. Check permissions.");
    onDetected(null);
  }
}

function startNativeDetection() {
  if (scannerInterval) clearInterval(scannerInterval);
  // Revert strictly to V1 interval logic. 100% reliable detection loop.
  scannerInterval = setInterval(async () => {
    if (scanLock || !videoEl.videoWidth) return;
    try {
      const barcodes = await nativeDetector.detect(videoEl);
      if (barcodes.length > 0) {
        handleDetection(barcodes[0].rawValue);
      }
    } catch (e) {
      // Ignore frame errors
    }
  }, 100);
}

function startZXingDetection() {
  zxingReader.decodeFromVideoElement(videoEl, (result, err) => {
    if (scanLock || !isScanningActive) return;
    if (result) {
      handleDetection(result.getText());
    }
  });
}

function handleDetection(barcode) {
  if (scanLock) return;
  scanLock = true;
  
  // Freeze frame visually
  try { videoEl.pause(); } catch(e) {}
  
  onDetectedCallback(barcode);
}

export function stopScanner() {
  isScanningActive = false;
  stopScannerHardwareOnly();
}

function stopScannerHardwareOnly() {
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
  }

  const currentStream = stream;
  stream = null;
  videoEl.srcObject = null;
  
  if (currentStream) {
    const tracks = currentStream.getTracks();
    setTimeout(() => {
      tracks.forEach(track => {
        try { track.stop(); } catch(e) {}
      });
    }, 50);
  }
}
