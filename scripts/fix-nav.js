/**
 * fix-nav.js
 * Replaces the outdated clothing store offcanvas navigation in all product HTML files
 * with a clean, bookstore-appropriate navigation menu.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'site', 'products');

// The new clean navigation HTML to inject
const NEW_NAV = `<ul class="offcanvas__menu_ul">
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="../index.html">Home</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="../collections/all.html">Shop</a>
    <ul class="offcanvas__sub_menu">
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">All Books</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">Fiction</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">Non-Fiction</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">Children's Books</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">Self-Help</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="../collections/all.html">Academic</a></li>
    </ul>
  </li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="../blogs/news.html">Blog</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="../pages/about.html">About Us</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="../pages/contact.html">Contact</a></li>
  <li class="offcanvas__menu_li">
    <a href="/api/auth/google" class="offcanvas__menu_item user--menu__icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18">
        <path fill="currentColor" d="M313.6 288c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4zM416 464c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16v-41.6C32 365.9 77.9 320 134.4 320c19.6 0 39.1 16 89.6 16 50.4 0 70-16 89.6-16 56.5 0 102.4 45.9 102.4 102.4V464zM224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm0-224c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z"/>
      </svg>
      <span class="offcanvas__menu_text__icon accounts__text--label">Log in</span>
    </a>
  </li>
</ul>`;

// Regex that matches the entire <ul class="offcanvas__menu_ul">...</ul> block
const NAV_REGEX = /<ul class="offcanvas__menu_ul">[\s\S]*?<\/ul>\s*<\/nav>/;

let fixed = 0;
let skipped = 0;

const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html'));

files.forEach(filename => {
  const filePath = path.join(PRODUCTS_DIR, filename);
  let html = fs.readFileSync(filePath, 'utf8');

  // Check if it has the old clothing items
  if (html.includes('Jackets') || html.includes('Halter Tops') || html.includes('Sweatshirts')) {
    // Replace everything from the opening offcanvas__menu_ul to the closing </nav>
    html = html.replace(NAV_REGEX, NEW_NAV + '\n</ul></nav>');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
    fixed++;
  } else {
    console.log(`⏭  Skipped (already clean): ${filename}`);
    skipped++;
  }
});

console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
