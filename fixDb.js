const { sequelize } = require('./config/database');
sequelize.query('ALTER TABLE "Carts" ALTER COLUMN "userId" DROP NOT NULL;')
  .then(() => {
    console.log('Fixed');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
