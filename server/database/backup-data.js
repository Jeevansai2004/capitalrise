const { connectToDatabase } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function backupData() {
  try {
    console.log('🔄 Starting data backup...');
    const db = await connectToDatabase();
    
    const collections = ['users', 'investments', 'referrals', 'withdrawals', 'messages', 'balances', 'loots'];
    const backupData = {};
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        backupData[collectionName] = data;
        console.log(`✅ Backed up ${data.length} documents from ${collectionName}`);
      } catch (error) {
        console.error(`❌ Error backing up ${collectionName}:`, error.message);
      }
    }
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../../backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Save backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function restoreData(backupFile) {
  try {
    console.log('🔄 Starting data restore...');
    const db = await connectToDatabase();
    
    const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
    
    for (const [collectionName, data] of Object.entries(backupData)) {
      if (data.length > 0) {
        const collection = db.collection(collectionName);
        await collection.insertMany(data);
        console.log(`✅ Restored ${data.length} documents to ${collectionName}`);
      }
    }
    
    console.log('🎉 Data restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'backup') {
    backupData();
  } else if (command === 'restore') {
    const backupFile = process.argv[3];
    if (!backupFile) {
      console.error('❌ Please provide backup file path: node backup-data.js restore <backup-file>');
      process.exit(1);
    }
    restoreData(backupFile);
  } else {
    console.log('Usage:');
    console.log('  node backup-data.js backup    - Create backup');
    console.log('  node backup-data.js restore <file> - Restore from backup');
  }
}

module.exports = { backupData, restoreData }; 