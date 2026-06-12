const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');
const PRODUCTS_DIR = path.join(SITE_DIR, 'products');

// Read the index.html to extract the correct header block
const indexHtml = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');

const headerStart = indexHtml.indexOf('<div class="header__inner row">');
const headerEndString = '<!-- END sections: header-group -->';
const headerEnd = indexHtml.indexOf(headerEndString, headerStart) + headerEndString.length;

if (headerStart === -1 || headerEnd === -1) {
  console.error("Could not find header in index.html");
  process.exit(1);
}

// THIS is the correct header block!
let correctHeaderHtml = indexHtml.substring(headerStart, headerEnd);

// Fix paths in the injected header (index.html has relative paths like "collections/all.html", we need "../collections/all.html")
correctHeaderHtml = correctHeaderHtml.replace(/href="collections\//g, 'href="../collections/');
correctHeaderHtml = correctHeaderHtml.replace(/href="index\.html/g, 'href="../index.html');
correctHeaderHtml = correctHeaderHtml.replace(/href="pages\//g, 'href="../pages/');
correctHeaderHtml = correctHeaderHtml.replace(/href="blogs\//g, 'href="../blogs/');


// Now apply this to all product pages
const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(filename => {
  const filePath = path.join(PRODUCTS_DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Find where our previous injected garbage starts.
  // It starts right after <div class="container">\n      ass="no-js"
  // Actually, the original file had:
  // <div class="header_bottom header__sticky  color-background-1 gradient  middle_left">
  //   <div class="container">
  // Then we injected our string.
  
  // So let's find the FIRST <div class="header_bottom...
  const targetStart = html.indexOf('<div class="header_bottom header__sticky  color-background-1 gradient  middle_left">');
  const targetInnerStart = html.indexOf('<div class="container">', targetStart) + '<div class="container">'.length;
  
  // Find where the garbage ends. We appended:
  // \n    </div>\n  </div>\n</header>\n</div>\n
  // And the original file had <!-- END sections: header-group --> but we deleted it, 
  // Wait, did we delete <!-- END sections: header-group -->?
  // Our previous script did: html.substring(blockEnd)
  // blockEnd was the index of '<!-- END sections: header-group -->'
  // So it kept the '<!-- END sections: header-group -->' !
  
  const blockEnd = html.indexOf('<!-- END sections: header-group -->');
  
  if (targetStart !== -1 && blockEnd !== -1) {
     // We replace everything from targetInnerStart to blockEnd + length
     // wait, correctHeaderHtml INCLUDES <!-- END sections: header-group -->
     // So we can replace everything from targetInnerStart to the end of <!-- END sections: header-group -->
     
     // But wait! We need to make sure we don't duplicate <div class="header__inner row">
     // correctHeaderHtml starts with <div class="header__inner row">
     // So if we inject it after <div class="container">, the structure will be perfect:
     // <div class="header_bottom...><div class="container"><div class="header__inner row">...
     
     const fullBlockEnd = blockEnd + '<!-- END sections: header-group -->'.length;
     
     html = html.substring(0, targetInnerStart) + '\n      ' + correctHeaderHtml + html.substring(fullBlockEnd);
     
     fs.writeFileSync(filePath, html, 'utf8');
     count++;
  }
});

console.log(`Replaced header in ${count} product pages to fix the layout.`);
