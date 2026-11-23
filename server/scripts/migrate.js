const fs = require('fs');
const path = require('path');
const { query } = require('../db');

function orderMigrationFiles(files) {
  return [...files].sort((left, right) => {
    if (left === 'init.sql') return right === 'init.sql' ? 0 : -1;
    if (right === 'init.sql') return 1;
    return left.localeCompare(right);
  });
}

async function migrate() {
  try {
    const directory = path.join(__dirname, '../migrations');
    const files = orderMigrationFiles(
      fs.readdirSync(directory).filter((file) => file.endsWith('.sql'))
    );

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

if (require.main === module) {
  migrate();
}

module.exports = { migrate, orderMigrationFiles };
