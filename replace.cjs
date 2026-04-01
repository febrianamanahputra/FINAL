const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace main container bg-white with bg-bg
  content = content.replace(/className="([^"]*)bg-white([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('flex flex-col h-full') || p1.includes('w-full h-full')) {
      return `className="${p1}bg-bg${p2}"`;
    }
    return `className="${p1}bg-card${p2}"`;
  });

  // Replace text-[#1a1a1a] with text-text
  content = content.replace(/text-\[\#1a1a1a\]/g, 'text-text');

  // Replace border-black/10 with border-border
  content = content.replace(/border-black\/10/g, 'border-border');
  content = content.replace(/border-black\/5/g, 'border-border');
  content = content.replace(/border-black\/15/g, 'border-border');
  content = content.replace(/border-black\/20/g, 'border-border');

  // Replace text-black/40 with text-text/40
  content = content.replace(/text-black\/(\d+)/g, 'text-text/$1');
  content = content.replace(/bg-black\/(\d+)/g, 'bg-text/$1');

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
