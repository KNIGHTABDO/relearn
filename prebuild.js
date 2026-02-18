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
