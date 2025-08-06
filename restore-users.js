const { MongoClient } = require('mongodb');
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

// MongoDB connection URI and DB name
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'capital_rise';
const client = new MongoClient(uri);

async function restoreUsers(db) {
  const usersCollection = db.collection('users');
  for (const user of userData.users) {
    try {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: user.email });
      if (!existingUser) {
        // Insert user
        await usersCollection.insertOne({
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          password: user.password,
          role: user.role,
          upi_id: user.upi_id,
          withdrawal_password: user.withdrawal_password,
          has_setup_withdrawal: user.has_setup_withdrawal,
          created_at: user.created_at
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

async function restoreBalances(db) {
  const balancesCollection = db.collection('client_balances');
  for (const balance of balanceData.balances) {
    try {
      // Check if balance already exists
      const existingBalance = await balancesCollection.findOne({ user_id: balance.user_id });
      if (!existingBalance) {
        // Insert balance
        await balancesCollection.insertOne({
          user_id: balance.user_id,
          balance: balance.balance,
          total_earned: balance.total_earned,
          created_at: balance.created_at
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
    await client.connect();
    const db = client.db(dbName);
    await restoreUsers(db);
    await restoreBalances(db);
    console.log('\n🎉 Data restoration completed!');
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await client.close();
  }
}

restore(); 