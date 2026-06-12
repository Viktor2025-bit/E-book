const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'site', 'products');

const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html'));
let count = 0;
files.forEach(filename => {
  const filePath = path.join(PRODUCTS_DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Fix the double </ul></ul></nav> from the previous script
  if (html.includes('</ul>\n</ul></nav>')) {
    html = html.replace(/<\/ul>\n<\/ul><\/nav>/g, '</ul>\n</nav>');
    fs.writeFileSync(filePath, html, 'utf8');
    count++;
  }
});
console.log(`Fixed double closing tag in ${count} files.`);
