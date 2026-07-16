const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function migrate() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/init.sql'),
      'utf8'
    );

    await query(sql);

    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:');
    console.error(err);
    process.exit(1);
  }
}

migrate();