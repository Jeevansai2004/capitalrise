const sqlite3 = require('sqlite3').verbose();
const dbPath = __dirname + '/../../database/capital_rise.db';

const db = new sqlite3.Database(dbPath);

// Check if the column already exists
const checkColumn = `PRAGMA table_info(password_reset_requests);`;

db.all(checkColumn, [], (err, columns) => {
  if (err) {
    console.error('Error checking columns:', err.message);
    db.close();
    process.exit(1);
  }
  const hasType = columns.some(col => col.name === 'type');
  if (hasType) {
    console.log("Column 'type' already exists. No migration needed.");
    db.close();
    process.exit(0);
  }
  // Add the column
  const alter = `ALTER TABLE password_reset_requests ADD COLUMN type TEXT;`;
  db.run(alter, [], (err) => {
    if (err) {
      console.error('Migration failed:', err.message);
      db.close();
      process.exit(1);
    }
    console.log("Migration successful: 'type' column added to password_reset_requests.");
    db.close();
    process.exit(0);
  });
}); 