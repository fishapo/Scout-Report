const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function migrate() {
  try {
    const directory = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(directory)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(directory, file), 'utf8');
      await query(sql);
      console.log(`Migration applied: ${file}`);
    }

    console.log('Database migrations completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:');
    console.error(err);
    process.exit(1);
  }
}

migrate();
