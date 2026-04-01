const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace light green backgrounds with bg-primary/10
  content = content.replace(/bg-\[\#f5ffe0\]/g, 'bg-primary/10');
  content = content.replace(/bg-\[\#f5ffe8\]/g, 'bg-primary/10');
  content = content.replace(/bg-\[\#e8f5c8\]/g, 'bg-primary/10');
  content = content.replace(/bg-\[\#fafff5\]/g, 'bg-primary/5');
  content = content.replace(/bg-\[\#aaee0014\]/g, 'bg-primary/10');
  content = content.replace(/bg-\[\#78c8001f\]/g, 'bg-primary/10');

  // Replace light gray backgrounds with bg-black/5
  content = content.replace(/bg-\[\#f8f8f8\]/g, 'bg-black/5');
  content = content.replace(/bg-\[\#fafafa\]/g, 'bg-black/5');
  content = content.replace(/border-\[\#efefef\]/g, 'border-border');

  // Replace dark green text with text-primary-dark
  content = content.replace(/text-\[\#4a8800\]/g, 'text-primary-dark');
  content = content.replace(/border-\[\#78c80080\]/g, 'border-primary/50');
  content = content.replace(/border-\[\#78c80066\]/g, 'border-primary/40');
  content = content.replace(/border-\[\#d0e8b0\]/g, 'border-primary/30');

  // Replace #1a1a1a with text-text
  content = content.replace(/text-\[\#1a1a1a\]/g, 'text-text');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src', 'components', 'pages'));
replaceInFile(path.join(__dirname, 'src', 'components', 'Overlay.tsx'));
replaceInFile(path.join(__dirname, 'src', 'components', 'Launcher.tsx'));
