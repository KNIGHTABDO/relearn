const fs = require('fs');
const path = require('path');

// Remove API routes (incompatible with static export)
const apiDir = path.join(__dirname, 'src', 'app', 'api');
if (fs.existsSync(apiDir)) {
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log('Removed API routes for static export');
} else {
  console.log('No API routes to remove');
}
