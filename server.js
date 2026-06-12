const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const session = require('express-session');
const passport = require('./config/passport');
const { sequelize, connectDB } = require('./config/database');
// Load models and associations
require('./models');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB().then(() => {
  sequelize.sync().then(() => {
    console.log('Database synced');
  });
});

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions and Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Static files
// Fuzzy-match middleware for product and blog images.
// Shopify mirrors append a 4-char content hash to filenames, and static HTML
// uses resized prefixes (e.g. _165x, _533x). We'll strip all of that to get the base UUID.
const createFuzzyMatcher = (baseDir) => (req, res, next) => {
  // req.path is already decoded and has no query-string
  const requestedFile = req.path.replace(/^\//, '');
  if (!requestedFile) return next();

  const exactPath = path.join(baseDir, requestedFile);
  if (fs.existsSync(exactPath)) return res.sendFile(exactPath);

  const ext  = path.extname(requestedFile);          // e.g. ".png"
  const stem = path.basename(requestedFile, ext);    // e.g. "1_c6e9ea20..._533xe69b"

  // Clean the stem: remove any trailing _[size] and everything after it
  const cleanStem = stem.replace(/_(?:compact|\d+x).*$/, '');

  let files;
  try { files = fs.readdirSync(baseDir); } catch { return next(); }

  // Match the first file that starts with the clean stem and is NOT a thumbnail itself
  const match = files.find(f =>
    f.startsWith(cleanStem) &&
    !f.includes('_compact') && !f.includes('_165x') && !f.includes('_360x') && !f.includes('_533x') && !f.includes('_720x')
  );

  if (match) return res.sendFile(path.join(baseDir, match));
  next();
};

const SHOP_FILES_DIR = path.join(__dirname, 'site', 'cdn', 'shop', 'files');
const SHOP_ARTICLES_DIR = path.join(__dirname, 'site', 'cdn', 'shop', 'articles');

app.use('/cdn/shop/files', createFuzzyMatcher(SHOP_FILES_DIR));
app.use('/cdn/shop/articles', createFuzzyMatcher(SHOP_ARTICLES_DIR));

// Serve the main site files — inject backend-bridge.js into every HTML response
const SITE_DIR = path.join(__dirname, 'site');
const BRIDGE_SCRIPT_TAG = '<script src="/cdn/shop/t/12/assets/backend-bridge.js" defer></script>';

// Hide the Shopify preview bar (and any top padding it adds) on all pages
const HIDE_SHOPIFY_BAR = `<style id="bems-hide-shopify-bar">
  /* Hide Shopify theme preview bar */
  #preview-bar-iframe,
  iframe[id*="preview"],
  iframe[src*="preview-bar"],
  iframe[src*="shopifycloud/preview"],
  .shopify-preview-bar,
  [id="shopify-preview-bar"],
  body > iframe:first-of-type { display: none !important; height: 0 !important; }
  /* Remove the top margin Shopify injects when the bar is present */
  html[style*="margin-top"], body[style*="margin-top"] { margin-top: 0 !important; }
</style>
<script>
  // Continuously remove any top-margin Shopify preview bar injects via JS
  (function() {
    var mo = new MutationObserver(function() {
      document.documentElement.style.removeProperty('margin-top');
      document.body && document.body.style.removeProperty('margin-top');
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    document.addEventListener('DOMContentLoaded', function() {
      mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    });
  })();
</script>
<style id="bems-offcanvas-styles">
  .offcanvas__menu_ul { list-style: none !important; padding: 0 !important; margin: 0 !important; }
  .offcanvas__menu_li { position: relative; border-bottom: 1px solid #f0f0f0; }
  .offcanvas__menu_item { display: block; padding: 16px 20px; font-size: 15px; color: #111; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .offcanvas__sub_menu { list-style: none !important; padding: 0 0 10px 0 !important; margin: 0 !important; display: none; background: #fafafa; }
  .offcanvas__menu_li.active > .offcanvas__sub_menu { display: block; }
  .offcanvas__sub_menu_li { border-top: 1px solid #f0f0f0; }
  .offcanvas__sub_menu_item { display: block; padding: 12px 20px 12px 35px; font-size: 14px; color: #555; text-decoration: none; }
  .offcanvas__menu_item:hover, .offcanvas__sub_menu_item:hover { color: #b8860b; }
  .offcanvas__sub_menu_toggle { position: absolute; right: 0; top: 0; width: 50px; height: 53px; border: none; background: transparent; cursor: pointer; border-left: 1px solid #f0f0f0; }
  .offcanvas__sub_menu_toggle::before, .offcanvas__sub_menu_toggle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #333; transition: all 0.3s; }
  .offcanvas__sub_menu_toggle::before { width: 12px; height: 2px; }
  .offcanvas__sub_menu_toggle::after { width: 2px; height: 12px; }
  .offcanvas__menu_li.active > .offcanvas__sub_menu_toggle::after { transform: translate(-50%, -50%) rotate(90deg); opacity: 0; }
  .user--menu__icon { display: flex; align-items: center; gap: 10px; }
</style>`;

app.use((req, res, next) => {
  // Only intercept HTML file requests
  const urlPath = req.path.endsWith('/') ? req.path + 'index.html' : req.path;
  if (!urlPath.endsWith('.html') && !urlPath.endsWith('.htm')) return next();

  const filePath = path.join(SITE_DIR, urlPath);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, 'utf8');
  // Inject backend-bridge.js before </body> if not already present
  if (!html.includes('backend-bridge.js')) {
    html = html.replace('</body>', `${BRIDGE_SCRIPT_TAG}\n</body>`);
  }
  // Inject cart-page.js on cart.html only (after bridge so BemsBridge is available)
  if (urlPath === '/cart.html' && !html.includes('cart-page.js')) {
    html = html.replace('</body>', `<script src="/cdn/shop/t/12/assets/cart-page.js" defer></script>\n</body>`);
  }
  // Always inject the Shopify bar hider into <head>
  if (!html.includes('bems-hide-shopify-bar')) {
    html = html.replace('</head>', `${HIDE_SHOPIFY_BAR}\n</head>`);
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.use(express.static(SITE_DIR));

// Serve Shopify CDN files (mirrored)
app.use('/cdn', express.static(path.join(__dirname, 'cdn.shopify.com')));
app.use('/cdn.shopify.com', express.static(path.join(__dirname, 'cdn.shopify.com')));

// Serve other mirrored CDNs
app.use('/cdn.judge.me', express.static(path.join(__dirname, 'cdn.judge.me')));
app.use('/s3.amazonaws.com', express.static(path.join(__dirname, 's3.amazonaws.com')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bookstore API is running' });
});

// Intercept Shopify's native recommendation endpoint to prevent it from injecting the SPA fallback HTML
app.get('/recommendations/products', (req, res) => {
  res.send('');
});

// Intercept Shopify's recently-viewed-card view endpoint used by recently_viewed_product7673.js.
// Without this, the SPA fallback would inject the entire homepage HTML into the recently-viewed section.
app.get('/products/:handle', (req, res, next) => {
  if (req.query.view === 'recent-view-card') {
    return res.send('');
  }
  next();
});

// Fallback to index.html for SPA-like behavior or handle 404s
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'site', 'index.html'));
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
