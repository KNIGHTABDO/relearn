const fs = require('fs');
const path = require('path');

// Polyfill Promise.withResolvers for Node < 22 (used by pdfjs-dist)
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  console.log('Added Promise.withResolvers polyfill');
}

// Remove API routes (incompatible with static export)
const apiDir = path.join(__dirname, 'src', 'app', 'api');
if (fs.existsSync(apiDir)) {
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log('Removed API routes for static export');
} else {
  console.log('No API routes to remove');
}

// Copy pdfjs worker to public/ for CSP-compatible loading
// react-pdf depends on pdfjs-dist — find it whether hoisted or nested
const workerPaths = [
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(__dirname, 'node_modules', 'react-pdf', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
];
const pdfWorkerDest = path.join(__dirname, 'public', 'pdf.worker.min.mjs');
let found = false;
for (const src of workerPaths) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, pdfWorkerDest);
    console.log('[prebuild] Copied pdf.worker.min.mjs from', src);
    found = true;
    break;
  }
}
if (!found) {
  console.warn('[prebuild] pdf.worker.min.mjs not found in node_modules — PDF viewer may not work');
}
