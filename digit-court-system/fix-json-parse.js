const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.join(__dirname, 'ethiopian-court-nextjs', 'src');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace:
    // if (userStr) {
    //   const userData = JSON.parse(userStr);
    // with:
    // if (userStr && userStr !== 'undefined') {
    //   try { const userData = JSON.parse(userStr); ... } catch (e) {} }
    
    // Simple regex replacement that captures what happens after JSON.parse
    const regex = /if\s*\(\s*userStr\s*\)\s*\{\s*(const\s+userData\s*=\s*JSON\.parse\(userStr\);[\s\S]*?(?=\s*\}\s*))(?=\s*\})/g;
    
    content = content.replace(regex, (match, body) => {
      // If it already has try-catch or is the one we just fixed, skip
      if (body.includes("try {")) return match;
      
      let indentedBody = body.split('\n').map(l => '  ' + l).join('\n');
      return `if (userStr && userStr !== 'undefined') {\n      try {\n${indentedBody}\n      } catch (e) {\n        console.error('Failed to parse user data');\n      }`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
