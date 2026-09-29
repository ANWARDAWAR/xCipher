const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'node_modules', '@cloudflare', 'next-on-pages', 'dist', 'index.js');

try {
  let content = fs.readFileSync(file, 'utf8');
  const target = 'await waitForProcessToClose(vercelBuild);';
  
  // Ensure we don't patch multiple times if script is run multiple times
  if (!content.includes('Removed _global-error.func via patch!')) {
    const replacement = 'await waitForProcessToClose(vercelBuild); try{require("fs").rmSync(".vercel/output/functions/_global-error.func",{force:true,recursive:true})}catch(e){}; console.log("Removed _global-error.func via patch!");';
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Successfully patched @cloudflare/next-on-pages to bypass _global-error bug.');
  } else {
    console.log('@cloudflare/next-on-pages is already patched.');
  }
} catch (e) {
  console.warn('Could not patch @cloudflare/next-on-pages (perhaps it is not installed yet).', e.message);
}
