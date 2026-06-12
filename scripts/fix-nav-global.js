/**
 * fix-nav-global.js
 * Recursively replaces the outdated clothing store offcanvas navigation 
 * across ALL HTML files in the site/ directory.
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');

function getPrefix(filePath) {
  // Count how many directories deep we are relative to the site root
  // site/index.html -> ""
  // site/collections/all.html -> "../"
  // site/blogs/news/article.html -> "../../"
  const relPath = path.relative(SITE_DIR, filePath);
  const depth = relPath.split(path.sep).length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function getNewNav(prefix) {
  return `<ul class="offcanvas__menu_ul">
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="${prefix}index.html">Home</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="${prefix}collections/all.html">Shop</a>
    <ul class="offcanvas__sub_menu">
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">All Books</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">Fiction</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">Non-Fiction</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">Children's Books</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">Self-Help</a></li>
      <li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${prefix}collections/all.html">Academic</a></li>
    </ul>
  </li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="${prefix}blogs/news.html">Blog</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="${prefix}pages/about.html">About Us</a></li>
  <li class="offcanvas__menu_li"><a class="offcanvas__menu_item" href="${prefix}pages/contact.html">Contact</a></li>
  <li class="offcanvas__menu_li">
    <a href="/api/auth/google" class="offcanvas__menu_item user--menu__icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18">
        <path fill="currentColor" d="M313.6 288c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4zM416 464c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16v-41.6C32 365.9 77.9 320 134.4 320c19.6 0 39.1 16 89.6 16 50.4 0 70-16 89.6-16 56.5 0 102.4 45.9 102.4 102.4V464zM224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm0-224c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z"/>
      </svg>
      <span class="offcanvas__menu_text__icon accounts__text--label">Log in</span>
    </a>
  </li>
</ul>`;
}

// Regex that matches the entire <ul class="offcanvas__menu_ul">...</ul> block
const NAV_REGEX = /<ul class="offcanvas__menu_ul">[\s\S]*?<\/ul>\s*<\/nav>/;

let fixed = 0;
let skipped = 0;

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Don't recurse into assets/images/etc to save time, mostly html are top level or one folder deep
      walk(filePath);
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(filePath, 'utf8');
      
      // Some files might have already been fixed, or might not have the menu.
      // We look for old clothing text OR the old complex structure.
      if (html.includes('Jackets') || html.includes('Halter Tops') || html.includes('Swim Wear') || html.includes('Home 01')) {
        const prefix = getPrefix(filePath);
        html = html.replace(NAV_REGEX, getNewNav(prefix) + '\n</nav>');
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ Fixed: ${path.relative(SITE_DIR, filePath)}`);
        fixed++;
      } else {
        // console.log(`⏭  Skipped: ${path.relative(SITE_DIR, filePath)}`);
        skipped++;
      }
    }
  }
}

walk(SITE_DIR);
console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
