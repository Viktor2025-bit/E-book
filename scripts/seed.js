const { Product } = require('../models');
const { sequelize, connectDB } = require('../config/database');

const seedProducts = [
  {
    title: 'Black Night and Sale Badge Book',
    handle: '1-new-and-sale-badge-product',
    description: 'A thrilling mystery novel set in the deep of night.',
    price: 25.00,
    imageUrl: '/cdn/shop/files/00001.jpg',
    category: 'Mystery',
  },
  {
    title: 'Every Thing You Never',
    handle: 'demo-product-title',
    description: 'A haunting horror story that will keep you awake at night.',
    price: 19.99,
    imageUrl: '/cdn/shop/files/13_a85f7b16-7bf4-44a1-aca8-55250190dc6b.png',
    category: 'Horror',
  },
  {
    title: 'End of Season Monsoon',
    handle: '9-without-shortcode-product',
    description: 'A poetic literary journey through rain and reflection.',
    price: 15.50,
    imageUrl: '/cdn/shop/files/12_a3b37a3f-6070-41bd-99f0-d5f8aa8f595c.png',
    category: 'Literature',
  },
  {
    title: '3D Design Products',
    handle: 'copy-of-3d-attractive-pot',
    description: 'A creative handbook on modern 3D design and pottery concepts.',
    price: 29.99,
    imageUrl: '/cdn/shop/files/16_c15dd6de-427a-4f22-8fee-21073d859414.png',
    category: 'Art',
  },
  {
    title: 'Self-Care Leah Chatman',
    handle: '7-sample-affiliate-product',
    description: 'An inspiring guide on self-care and mental health practices.',
    price: 12.99,
    imageUrl: '/cdn/shop/files/10_4bcb4218-9cbe-4906-8ec0-19a4f21f297f.png',
    category: 'Paperback',
  },
  {
    title: 'Welcome To Space Book',
    handle: '8-countdown-product',
    description: 'An educational astronomy book for kids and space enthusiasts.',
    price: 18.00,
    imageUrl: '/cdn/shop/files/11_274c14d0-5fba-4d48-ab54-21692dc66b06.png',
    category: 'Children',
  },
  {
    title: 'Murdering Last Year',
    handle: '4-soldout-product',
    description: 'A dark crime and mystery novel about a cold case.',
    price: 22.00,
    imageUrl: '/cdn/shop/files/7_2a4e4ca6-75f2-4f97-b6d1-3bb5f47c0995.png',
    category: 'Mystery',
  },
  {
    title: 'Fitness stay Healthy',
    handle: '5-simple-product',
    description: 'A complete manual on fitness, diet, and healthy lifestyle choices.',
    price: 14.99,
    imageUrl: '/cdn/shop/files/8_71a4989a-2d22-42e6-835b-f78f6c050914.png',
    category: 'Self-Help',
  },
  {
    title: 'About The First Night',
    handle: '10-this-is-the-large-title-for-testing-large-title-and-there-is-an-image-for-testing',
    description: 'An epic supernatural fantasy novel.',
    price: 24.50,
    imageUrl: '/cdn/shop/files/2_42f44c02-23bd-467f-a9bc-d28ad5e111fc.png',
    category: 'Fantasy',
  },
  {
    title: 'Book Hardcover Both',
    handle: '12-unique-content-for-each-product-on-the-product-tab',
    description: 'A classic collection on poetry and prose.',
    price: 35.00,
    imageUrl: '/cdn/shop/files/4_3e90e59c-bb34-40aa-823b-00526405e07a.png',
    category: 'Hardcover',
  },
  {
    title: 'By The Air Renowned',
    handle: '3-variable-product',
    description: 'A bestselling romance novel of love and destiny.',
    price: 16.99,
    imageUrl: '/cdn/shop/files/6_b5abd768-1935-4a75-925e-99d8eef92612.png',
    category: 'Romance',
  },
  {
    title: 'Dummy product name',
    handle: 'dummy-product-name',
    description: 'An entry-level arts and crafts reference guide.',
    price: 9.99,
    imageUrl: '/cdn/shop/files/1_c6e9ea20-6a17-444d-80ee-4feab1ee757f.png',
    category: 'Arts',
  },
  {
    title: 'Product with Video',
    handle: '11-product-with-video',
    description: 'A multimedia-rich learning book for children and teens.',
    price: 20.00,
    imageUrl: '/cdn/shop/files/3_14c4059d-d1ef-42d4-8d9e-13c5f49df743.png',
    category: 'Educational',
  },
  {
    title: 'New Badge Product',
    handle: '2-new-badge-product',
    description: 'A science fiction masterpiece set in a dystopian future.',
    price: 17.50,
    imageUrl: '/cdn/shop/files/5_b3d5c414-b1eb-4b2a-89a1-778263590f05.png',
    category: 'Sci-Fi',
  },
  {
    title: 'Variable with Soldout Product',
    handle: '6-variable-with-soldout-product',
    description: 'A tense psychological thriller.',
    price: 18.99,
    imageUrl: '/cdn/shop/files/9_30f40d12-d04b-4f9e-bd90-d46e01a88b0f.png',
    category: 'Thriller',
  },
  {
    title: 'Demo Product Title 1',
    handle: 'demo-product-title-1',
    description: 'A comprehensive cookbook of global culinary recipes.',
    price: 28.00,
    imageUrl: '/cdn/shop/files/14_1b354d24-5d9a-4d2b-a3ee-0012754668aa.png',
    category: 'Cooking',
  },
  {
    title: 'Demo Product Title',
    handle: 'demo-product-title-detail',
    description: 'An advanced manual on web design principles.',
    price: 32.00,
    imageUrl: '/cdn/shop/files/15_d1b28d6a-543e-4b22-83ef-d238714aa4bb.png',
    category: 'Technology',
  },
  {
    title: 'Product Dummy Title',
    handle: 'product-dummy-title',
    description: 'A historical fiction novel centered on ancient civilisations.',
    price: 15.99,
    imageUrl: '/cdn/shop/files/17_c1a35d9a-d1ea-42b4-82ee-001265c6ab4a.png',
    category: 'History',
  }
];

const seed = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: true });
    await Product.bulkCreate(seedProducts);
    console.log('Database seeded successfully with 18 products!');
    process.exit();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
