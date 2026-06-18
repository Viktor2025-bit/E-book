const Product = require('../models/Product');
const { Op } = require('sequelize');

const BEMS_CATALOG_HANDLES = [
  'digital-business-blueprint',
  'code-your-first-web-app',
  'the-focus-method',
  'african-futures-anthology',
  'moonlit-pages',
  'research-writing-made-simple',
  'little-stars-learn-space',
  'money-skills-for-creators',
  'design-systems-pocket-guide',
  'mindful-mornings',
  'the-lagos-letters',
  'exam-prep-essentials',
];

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { handle: { [Op.in]: BEMS_CATALOG_HANDLES } },
      order: [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductByHandle = async (req, res) => {
  try {
    if (!BEMS_CATALOG_HANDLES.includes(req.params.handle)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findOne({ where: { handle: req.params.handle } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q = '', category = '', sort = '' } = req.query;
    const query = q.trim();
    const where = {
      handle: { [Op.in]: BEMS_CATALOG_HANDLES },
    };

    if (category.trim()) {
      where.category = { [Op.iLike]: category.trim() };
    }

    if (query) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { author: { [Op.iLike]: `%${query}%` } },
        { category: { [Op.iLike]: `%${query}%` } },
        { format: { [Op.iLike]: `%${query}%` } },
        { accessNote: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
      ];
    }

    const sortOrder = {
      title: [['title', 'ASC']],
      'price-asc': [['price', 'ASC']],
      'price-desc': [['price', 'DESC']],
    };

    const products = await Product.findAll({
      where,
      order: sortOrder[sort] || [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
