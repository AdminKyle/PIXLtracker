import { BrowserMultiFormatReader } from '@zxing/browser';

const videoEl = document.getElementById('scanner-video');
let stream = null;
let scanLock = false;
let zxingReader = null;
let useNativeDetector = false;
let nativeDetector = null;
let rAF_ID = null;
let isVisible = true;
let isScanningActive = false;
let onDetectedCallback = null;

// Validation state
let lastReadBarcode = null;
let consecutiveReads = 0;
const REQUIRED_CONSECUTIVE_READS = 2; // Need 2 same reads to prevent phantom scans

// Handle visibility changes (Camera lifecycle management)
document.addEventListener('visibilitychange', () => {
  isVisible = document.visibilityState === 'visible';
  if (!isVisible && isScanningActive) {
    stopScanner();
  } else if (isVisible && isScanningActive && !stream) {
    // Resume scanning if it was active
    startScanner(onDetectedCallback);
  }
});

export async function initScanner(onDetected) {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.length > 0) {
        nativeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
        useNativeDetector = true;
      }
    } catch (e) {
      console.warn("Native BarcodeDetector init failed, falling back to ZXing", e);
    }
  }

  if (!useNativeDetector) {
    zxingReader = new BrowserMultiFormatReader();
  }

  document.getElementById('close-scanner-btn').addEventListener('click', () => {
    stopScanner();
    isScanningActive = false;
    onDetected(null);
  });
}

export async function startScanner(onDetected) {
  scanLock = false;
  isScanningActive = true;
  onDetectedCallback = onDetected;
  lastReadBarcode = null;
  consecutiveReads = 0;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment', 
        width: { ideal: 1280 }, 
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' }] // Mobile specific constraint
      }
    });
    
    videoEl.srcObject = stream;
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });

    if (useNativeDetector) {
      scanLoopNative();
    } else {
      startZXingDetection();
    }
  } catch (error) {
    console.error("Camera access failed", error);
    isScanningActive = false;
    
    // Better Error Recovery based on type
    if (error.name === 'NotAllowedError') {
      alert("Camera permission denied. Please enable in browser settings.");
    } else {
      alert("Camera unavailable or blocked.");
    }
    onDetected(null);
  }
}

// Throttled native scanning loop for performance
let lastFrameTime = 0;
const SCAN_INTERVAL_MS = 100; // ~10fps (Performance Mode)

async function scanLoopNative(timestamp) {
  if (!isScanningActive || scanLock) return;

  if (timestamp - lastFrameTime >= SCAN_INTERVAL_MS) {
    lastFrameTime = timestamp;
    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      try {
        const barcodes = await nativeDetector.detect(videoEl);
        if (barcodes.length > 0) {
          validateAndHandleDetection(barcodes[0].rawValue);
        }
      } catch (e) {
        console.error("Native detection error", e);
      }
    }
  }
  
  if (isScanningActive && !scanLock) {
    rAF_ID = requestAnimationFrame(scanLoopNative);
  }
}

function startZXingDetection() {
  // ZXing handles its own internal loop, but we can manage validation inside its callback
  zxingReader.decodeFromVideoElement(videoEl, (result, err) => {
    if (scanLock || !isScanningActive) return;
    if (result) {
      validateAndHandleDetection(result.getText());
    }
  });
}

function validateAndHandleDetection(barcode) {
  if (scanLock) return;
  
  // Basic validation rules
  if (!barcode || barcode.length < 6) return;

  // Intelligent Scan Validation
  if (barcode === lastReadBarcode) {
    consecutiveReads++;
  } else {
    lastReadBarcode = barcode;
    consecutiveReads = 1;
  }

  if (consecutiveReads >= REQUIRED_CONSECUTIVE_READS) {
    // PASS: Validated
    scanLock = true;
    
    // Visually freeze the frame (Processing state UX)
    videoEl.pause();
    
    // Send to app layer immediately
    onDetectedCallback(barcode);
    
    // Note: Do NOT stop streams immediately here. App layer will handle the processing state
    // and call stopScanner() when returning to dashboard.
  }
}

export function stopScanner() {
  isScanningActive = false;
  
  if (rAF_ID) {
    cancelAnimationFrame(rAF_ID);
    rAF_ID = null;
  }
  
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
    });
    stream = null;
  }
  
  videoEl.srcObject = null;
  
  // Cleanup ZXing completely to prevent memory leaks
  if (zxingReader) {
    zxingReader.reset();
  }
}
