const { connectToDatabase } = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const db = await connectToDatabase();
    
    // Create collections if they don't exist
    const collections = [
      'users',
      'investments', 
      'referrals',
      'withdrawals',
      'messages',
      'balances',
      'loots'
    ];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }

    // Create indexes for better performance
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    console.log('✅ Created indexes for users collection');

    const messagesCollection = db.collection('messages');
    await messagesCollection.createIndex({ timestamp: 1 });
    await messagesCollection.createIndex({ senderId: 1, receiverId: 1 });
    console.log('✅ Created indexes for messages collection');

    const investmentsCollection = db.collection('investments');
    await investmentsCollection.createIndex({ userId: 1 });
    await investmentsCollection.createIndex({ createdAt: 1 });
    console.log('✅ Created indexes for investments collection');

    const referralsCollection = db.collection('referrals');
    await referralsCollection.createIndex({ referrerId: 1 });
    await referralsCollection.createIndex({ referralCode: 1 }, { unique: true });
    console.log('✅ Created indexes for referrals collection');

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 