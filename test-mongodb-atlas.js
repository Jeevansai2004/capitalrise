require('dotenv').config();
const { MongoClient } = require('mongodb');

// Your MongoDB Atlas connection string with your actual password
const uri = process.env.MONGO_URI || 'mongodb+srv://saijeevan362:7XHXg9dQM2uuIdm4@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority&appName=CapitalRiseCluster';
const dbName = process.env.MONGO_DB || 'capital_rise';

console.log('🔍 Testing MongoDB Atlas Connection...');
console.log('URI configured:', !!process.env.MONGO_URI);
console.log('DB configured:', !!process.env.MONGO_DB);

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    
    const db = client.db(dbName);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test creating a test document
    const testCollection = db.collection('test_connection');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'MongoDB Atlas connection test successful!' 
    });
    console.log('✅ Test document created successfully!');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('🧹 Test document cleaned up');
    
    console.log('🎉 MongoDB Atlas connection test completed successfully!');
    console.log('💾 Your data will now be stored permanently in the cloud!');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your password is correct: 7XHXg9dQM2uuIdm4');
    console.log('2. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('3. Verify your database user has the correct permissions');
    console.log('4. Ensure your cluster is running and accessible');
  } finally {
    await client.close();
  }
}

testConnection(); 