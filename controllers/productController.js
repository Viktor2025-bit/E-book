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
    const { q } = req.query;
    const products = await Product.findAll({
      where: {
        handle: { [Op.in]: BEMS_CATALOG_HANDLES },
        [Op.or]: [
          { title: { [Op.iLike]: `%${q || ''}%` } },
          { author: { [Op.iLike]: `%${q || ''}%` } },
          { category: { [Op.iLike]: `%${q || ''}%` } },
          { description: { [Op.iLike]: `%${q || ''}%` } },
        ],
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
