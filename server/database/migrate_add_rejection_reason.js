const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/capital_rise.db');
const db = new sqlite3.Database(dbPath);

const columnName = 'rejection_reason';

// Check if the column already exists
const checkColumnSql = `PRAGMA table_info(referrals);`;

db.all(checkColumnSql, [], (err, columns) => {
  if (err) {
    console.error('Error checking columns:', err.message);
    db.close();
    process.exit(1);
  }
  const exists = columns.some(col => col.name === columnName);
  if (exists) {
    console.log(`Column '${columnName}' already exists in 'referrals' table.`);
    db.close();
    process.exit(0);
  }
  // Add the column
  const alterSql = `ALTER TABLE referrals ADD COLUMN ${columnName} TEXT;`;
  db.run(alterSql, [], (err) => {
    if (err) {
      console.error('Error adding column:', err.message);
      db.close();
      process.exit(1);
    }
    console.log(`Column '${columnName}' added to 'referrals' table successfully.`);
    db.close();
    process.exit(0);
  });
}); 