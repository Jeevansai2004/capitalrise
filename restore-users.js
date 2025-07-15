const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Check if backup files exist
if (!fs.existsSync('./user-data-backup.json')) {
  console.error('❌ user-data-backup.json not found!');
  process.exit(1);
}

if (!fs.existsSync('./balance-data-backup.json')) {
  console.error('❌ balance-data-backup.json not found!');
  process.exit(1);
}

// Load backup data
const userData = JSON.parse(fs.readFileSync('./user-data-backup.json', 'utf8'));
const balanceData = JSON.parse(fs.readFileSync('./balance-data-backup.json', 'utf8'));

console.log(`📊 Restoring ${userData.totalUsers} users and ${balanceData.totalBalances} balance records...\n`);

// Use the same database path as the main app
const dbPath = process.env.DB_PATH || './database/capital_rise.db';
const db = new sqlite3.Database(dbPath);

async function restoreUsers() {
  for (const user of userData.users) {
    try {
      // Check if user already exists
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingUser) {
        // Insert user
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO users (username, email, mobile, password, role, upi_id, withdrawal_password, has_setup_withdrawal, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            user.username,
            user.email,
            user.mobile,
            user.password,
            user.role,
            user.upi_id,
            user.withdrawal_password,
            user.has_setup_withdrawal,
            user.created_at
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        console.log(`✅ Restored user: ${user.username} (${user.email})`);
      } else {
        console.log(`⏭️  User already exists: ${user.username} (${user.email})`);
      }
    } catch (error) {
      console.error(`❌ Error restoring user ${user.username}:`, error.message);
    }
  }
}

async function restoreBalances() {
  for (const balance of balanceData.balances) {
    try {
      // Check if balance already exists
      const existingBalance = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM client_balances WHERE user_id = ?', [balance.user_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingBalance) {
        // Insert balance
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO client_balances (user_id, balance, total_earned, created_at)
            VALUES (?, ?, ?, ?)
          `, [
            balance.user_id,
            balance.balance,
            balance.total_earned,
            balance.created_at
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
        console.log(`✅ Restored balance for user_id: ${balance.user_id}`);
      } else {
        console.log(`⏭️  Balance already exists for user_id: ${balance.user_id}`);
      }
    } catch (error) {
      console.error(`❌ Error restoring balance for user_id ${balance.user_id}:`, error.message);
    }
  }
}

async function restore() {
  try {
    await restoreUsers();
    await restoreBalances();
    console.log('\n🎉 Data restoration completed!');
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    db.close();
  }
}

restore(); 