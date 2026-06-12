const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');
const PRODUCTS_DIR = path.join(SITE_DIR, 'products');

// Read the index.html to extract the correct header block
const indexHtml = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');

// The header inner block starts at <div class="header__inner row"> and ends before <!-- Header Action Button End -->
// Let's grab it using string manipulation
const headerStart = indexHtml.indexOf('<div class="header__inner row">');
const headerEndString = '<!-- Header Action Button End -->';
const headerEnd = indexHtml.indexOf(headerEndString, headerStart) + headerEndString.length;

if (headerStart === -1 || headerEnd === -1) {
  console.error("Could not find header in index.html");
  process.exit(1);
}

const correctHeaderHtml = indexHtml.substring(headerStart, headerEnd);

// Now apply this to all product pages
const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(filename => {
  const filePath = path.join(PRODUCTS_DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  
  const targetStart = html.indexOf('<div class="header__inner row">');
  // Find where the broken quick__information--body ends
  // It usually ends around <div class="offcanvas-overlay"></div>
  let targetEndString = '<div class="offcanvas-overlay"></div>';
  let targetEnd = html.indexOf(targetEndString, targetStart);
  
  if (targetStart !== -1 && targetEnd !== -1) {
    // Include the ending string to replace it too
    // Wait, the new header from index doesn't have offcanvas-overlay there, we just replace it up to the end of the header__inner row.
    // Actually, in the broken file, the header__inner row contains the broken nav, and then offcanvas-overlay is right after it.
    // Let's replace from targetStart to targetEnd (including targetEndString) with correctHeaderHtml + '</div>'
    // Since correctHeaderHtml doesn't close the container.
    // Wait, let's see how index.html closes it.
    
    // Let's just do a simple replace: replace the entire <div class="header__inner row"> block
    // We will extract the header block from the product file
    const blockEnd = html.indexOf('<!-- END sections: header-group -->', targetStart);
    if (blockEnd !== -1) {
       // We replace everything between targetStart and blockEnd with the correct header (plus some closing tags)
       // Let's refine this to be safe.
       const replacement = correctHeaderHtml + '\n    </div>\n  </div>\n</header>\n</div>\n';
       html = html.substring(0, targetStart) + replacement + html.substring(blockEnd);
       
       // Fix paths in the injected header (index.html has relative paths like "collections/all.html", we need "../collections/all.html")
       html = html.replace(/href="collections\//g, 'href="../collections/');
       html = html.replace(/href="index\.html/g, 'href="../index.html');
       html = html.replace(/href="pages\//g, 'href="../pages/');
       html = html.replace(/href="blogs\//g, 'href="../blogs/');
       
       fs.writeFileSync(filePath, html, 'utf8');
       count++;
    }
  }
});

console.log(`Replaced header in ${count} product pages to match the homepage.`);
