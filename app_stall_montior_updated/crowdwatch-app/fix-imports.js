const fs = require('fs');
const path = require('path');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace @/ with relative paths based on file location
  if (filePath.includes('/pages/')) {
    content = content.replace(/@\//g, '../');
  } else if (filePath.includes('/components/dashboard/')) {
    content = content.replace(/@\//g, '../../');
  } else if (filePath.includes('/components/analytics/')) {
    content = content.replace(/@\//g, '../../');
  } else {
    content = content.replace(/@\//g, './');
  }
  
  fs.writeFileSync(filePath, content);
}

// Run this on your files