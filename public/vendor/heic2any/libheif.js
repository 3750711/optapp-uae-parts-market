// libheif.js - JavaScript wrapper for libheif WASM
// This file is loaded by heic2any to provide HEIF/HEIC decoding capabilities

// The actual implementation will be provided by the heic2any library
// when it loads the WASM module. This is just a stub to prevent 404 errors.

if (typeof self !== 'undefined') {
  // Web Worker context
  self.libheif = self.libheif || {};
} else if (typeof window !== 'undefined') {
  // Main thread context
  window.libheif = window.libheif || {};
}

console.log('libheif.js wrapper loaded');