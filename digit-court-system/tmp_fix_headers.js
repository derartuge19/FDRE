const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('ethiopian-court-nextjs/src/app/**/page.tsx');
let updatedCount = 0;

files.forEach(file => {
  if (file.includes('login') || file === 'ethiopian-court-nextjs/src/app/page.tsx') return;
  
  const fullPath = path.resolve(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const ogContent = content;

  // Replace <header ...> ... </header> with <Header />
  content = content.replace(/<header[\s\S]*?<\/header>/g, '<Header />');

  // Add import if needed
  if (content !== ogContent && !content.includes('import Header')) {
    content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1 } from 'lucide-react';\nimport Header from '@/components/Header';");
  }

  if (content !== ogContent) {
    fs.writeFileSync(fullPath, content);
    console.log('Updated', file);
    updatedCount++;
  }
});
console.log('Done, updated', updatedCount, 'files');
