const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const { DataTypes } = require('sequelize');
require('dotenv').config();

const session = require('express-session');
const passport = require('./config/passport');
const { sequelize, connectDB } = require('./config/database');
require('./models');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const subscribeRoutes = require('./routes/subscribeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_DIR = path.join(__dirname, 'site');
const MIRRORED_CDN_DIR = path.join(__dirname, ['cdn', 'shopify', 'com'].join('.'));

connectDB().then(async () => {
  try {
    await sequelize.sync();
    const queryInterface = sequelize.getQueryInterface();
    const userTable = await queryInterface.describeTable('Users');
    if (!userTable.avatarUrl) {
      await queryInterface.addColumn('Users', 'avatarUrl', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      console.log('Added Users.avatarUrl column');
    }
    console.log('Database synced');
  } catch (error) {
    console.error('Database sync failed:', error.message);
  }
});

app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is required in production.');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

const createFuzzyMatcher = (baseDir) => (req, res, next) => {
  const requestedFile = req.path.replace(/^\//, '');
  if (!requestedFile) return next();

  const exactPath = path.join(baseDir, requestedFile);
  if (fs.existsSync(exactPath)) return res.sendFile(exactPath);

  const ext = path.extname(requestedFile);
  const stem = path.basename(requestedFile, ext);
  const cleanStem = stem.replace(/_(?:compact|\d+x).*$/, '');

  let files;
  try {
    files = fs.readdirSync(baseDir);
  } catch {
    return next();
  }

  const match = files.find((file) =>
    file.startsWith(cleanStem) &&
    !file.includes('_compact') &&
    !file.includes('_165x') &&
    !file.includes('_360x') &&
    !file.includes('_533x') &&
    !file.includes('_720x')
  );

  if (match) return res.sendFile(path.join(baseDir, match));
  next();
};

app.use('/cdn/shop/files', createFuzzyMatcher(path.join(SITE_DIR, 'cdn', 'shop', 'files')));
app.use('/cdn/shop/articles', createFuzzyMatcher(path.join(SITE_DIR, 'cdn', 'shop', 'articles')));

app.get(['/products/:handle.html', '/products/:handle'], (req, res) => {
  if (req.query.view === 'recent-view-card') return res.send('');
  res.sendFile(path.join(SITE_DIR, 'product.html'));
});

app.get('/login.html', (req, res) => {
  res.redirect('/account/login.html');
});

const redirectLegacyMirrorPage = (req, res, next) => {
  const requestedPath = req.path.toLowerCase();

  if (
    requestedPath === '/cdn.html' ||
    requestedPath === '/account/login4236.html' ||
    requestedPath.startsWith('/blogs/')
  ) {
    return res.redirect('/collections/all.html');
  }

  if (
    requestedPath === '/pages/team.html' ||
    requestedPath === '/pages/wishlist.html'
  ) {
    return res.redirect('/collections/all.html');
  }

  const isLegacyCollection =
    requestedPath.startsWith('/collections/') &&
    requestedPath !== '/collections/all.html' &&
    requestedPath !== '/collections/all';

  if (isLegacyCollection) return res.redirect('/collections/all.html');

  next();
};

app.get([
  '/pages/wishlist.html',
  '/pages/team.html',
  '/collections.html',
  '/collections/men-collection.html',
  '/collections/women-collection.html',
  '/collections/best-seller.html',
  '/collections/best-seller2679.html',
  '/collections/best-seller4658.html',
  '/collections/featured-product.html',
  '/collections/new-arrival.html',
  '/collections/top-rated.html',
  '/blogs',
  '/blogs/news.html',
], (req, res) => {
  res.redirect('/collections/all.html');
});

app.use(redirectLegacyMirrorPage);

// API routes must come before static file middleware
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscribe', subscribeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BEMS Books API is running' });
});

app.use(express.static(SITE_DIR));

// Keep mirrored local CDN files available for fonts and existing cover assets.
app.use('/cdn', express.static(MIRRORED_CDN_DIR));
app.use('/s3.amazonaws.com', express.static(path.join(__dirname, 's3.amazonaws.com')));

// Legacy mirrored endpoints should not inject full fallback HTML.
app.get('/recommendations/products', (req, res) => {
  res.send('');
});

app.use((req, res) => {
  res.sendFile(path.join(SITE_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
