const { Product } = require('../models');
const { sequelize, connectDB } = require('../config/database');

const seedProducts = [
  {
    title: 'Digital Business Blueprint',
    handle: 'digital-business-blueprint',
    author: 'Maya Okafor',
    description: 'A practical guide to launching, pricing, and growing a digital business with lean tools and clear metrics.',
    price: 18.00,
    imageUrl: '/cdn/shop/files/10_307a27ee-36dd-48cf-b0df-11b80f223bab1ef4.png',
    category: 'Business',
    format: 'PDF + EPUB',
    pages: 214,
  },
  {
    title: 'Code Your First Web App',
    handle: 'code-your-first-web-app',
    author: 'Daniel Hart',
    description: 'Beginner-friendly lessons for planning, building, and deploying a complete web application.',
    price: 22.50,
    imageUrl: '/cdn/shop/files/11_274c14d0-5fba-4d48-ab54-21692dc66b0623ab.png',
    category: 'Technology',
    format: 'PDF',
    pages: 268,
  },
  {
    title: 'The Focus Method',
    handle: 'the-focus-method',
    author: 'Leah Chatman',
    description: 'A calm, realistic self-help workbook for better habits, deep work, and weekly planning.',
    price: 12.99,
    imageUrl: '/cdn/shop/files/10_4bcb4218-9cbe-4906-8ec0-19a4f21f297f0b6e.png',
    category: 'Self-Help',
    format: 'PDF Workbook',
    pages: 146,
  },
  {
    title: 'African Futures Anthology',
    handle: 'african-futures-anthology',
    author: 'Edited by Nia Bello',
    description: 'Twelve speculative short stories exploring technology, memory, migration, and identity across Africa.',
    price: 16.75,
    imageUrl: '/cdn/shop/files/12_a3b37a3f-6070-41bd-99f0-d5f8aa8f595c1d48.png',
    category: 'African Literature',
    format: 'EPUB',
    pages: 238,
  },
  {
    title: 'Moonlit Pages',
    handle: 'moonlit-pages',
    author: 'Ari Stone',
    description: 'A literary mystery about an archivist who discovers a coded diary inside a rare book collection.',
    price: 14.50,
    imageUrl: '/cdn/shop/files/7_2a4e4ca6-75f2-4f97-b6d1-3bb5f47c0995.png',
    category: 'Fiction',
    format: 'PDF + EPUB',
    pages: 302,
  },
  {
    title: 'Research Writing Made Simple',
    handle: 'research-writing-made-simple',
    author: 'Dr. Samuel Adeyemi',
    description: 'A compact academic writing guide covering topic selection, citations, structure, and revision.',
    price: 11.00,
    imageUrl: '/cdn/shop/files/4_3e90e59c-bb34-40aa-823b-00526405e07a.png',
    category: 'Academic',
    format: 'PDF',
    pages: 128,
  },
  {
    title: 'Little Stars Learn Space',
    handle: 'little-stars-learn-space',
    author: 'Amelia Bright',
    description: 'A colorful children\'s ebook introducing planets, stars, rockets, and the joy of discovery.',
    price: 9.99,
    imageUrl: '/cdn/shop/files/11_274c14d0-5fba-4d48-ab54-21692dc66b0682d4.png',
    category: 'Children',
    format: 'PDF',
    pages: 64,
  },
  {
    title: 'Money Skills for Creators',
    handle: 'money-skills-for-creators',
    author: 'Tomi Richards',
    description: 'Simple systems for budgeting, pricing creative work, tracking income, and planning sustainable growth.',
    price: 13.25,
    imageUrl: '/cdn/shop/files/13_a85f7b16-7bf4-44a1-aca8-55250190dc6b3694.png',
    category: 'Business',
    format: 'PDF',
    pages: 172,
  },
  {
    title: 'Design Systems Pocket Guide',
    handle: 'design-systems-pocket-guide',
    author: 'Irene Cole',
    description: 'A concise guide to reusable UI foundations, components, documentation, and design handoff.',
    price: 19.00,
    imageUrl: '/cdn/shop/files/16_c15dd6de-427a-4f22-8fee-21073d859414253a.png',
    category: 'Technology',
    format: 'PDF + EPUB',
    pages: 196,
  },
  {
    title: 'Mindful Mornings',
    handle: 'mindful-mornings',
    author: 'Grace Morgan',
    description: 'Thirty short reflections and planning prompts for building peaceful, intentional mornings.',
    price: 8.99,
    imageUrl: '/cdn/shop/files/8_71a4989a-2d22-42e6-835b-f78f6c050914.png',
    category: 'Self-Help',
    format: 'PDF',
    pages: 92,
  },
  {
    title: 'The Lagos Letters',
    handle: 'the-lagos-letters',
    author: 'Kelechi Nwosu',
    description: 'A warm contemporary novel told through letters, voice notes, and emails between two old friends.',
    price: 15.00,
    imageUrl: '/cdn/shop/files/6_b5abd768-1935-4a75-925e-99d8eef92612.png',
    category: 'African Literature',
    format: 'EPUB',
    pages: 256,
  },
  {
    title: 'Exam Prep Essentials',
    handle: 'exam-prep-essentials',
    author: 'BEMS Learning Team',
    description: 'A student-friendly study system for note-taking, revision timetables, and exam confidence.',
    price: 10.50,
    imageUrl: '/cdn/shop/files/5_b3d5c414-b1eb-4b2a-89a1-778263590f05.png',
    category: 'Academic',
    format: 'PDF Workbook',
    pages: 118,
  },
];

const seed = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: true });
    await Product.bulkCreate(seedProducts);
    console.log(`Database seeded successfully with ${seedProducts.length} BEMS Books ebooks.`);
    process.exit();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
