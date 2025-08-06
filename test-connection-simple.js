const { MongoClient } = require('mongodb');

// Test different connection string formats
const connectionStrings = [
  // Format 1: URL encoded password
  'mongodb+srv://saijeevan362:JeevanSai%40123@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority',
  
  // Format 2: Without appName
  'mongodb+srv://saijeevan362:JeevanSai%40123@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority',
  
  // Format 3: Different encoding
  'mongodb+srv://saijeevan362:JeevanSai%40123@capitalrisecluster.fauhhu9.mongodb.net/?retryWrites=true&w=majority'
];

async function testConnections() {
  for (let i = 0; i < connectionStrings.length; i++) {
    const uri = connectionStrings[i];
    console.log(`\n🔍 Testing connection string ${i + 1}:`);
    console.log(`URI: ${uri.replace(/:[^:@]*@/, ':****@')}`);
    
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log(`✅ Connection ${i + 1} successful!`);
      
      const db = client.db('capital_rise');
      const collections = await db.listCollections().toArray();
      console.log(`📊 Collections found: ${collections.length}`);
      
      await client.close();
      console.log(`🎉 Using connection string ${i + 1}`);
      return uri;
      
    } catch (error) {
      console.log(`❌ Connection ${i + 1} failed: ${error.message}`);
      await client.close();
    }
  }
  
  console.log('\n❌ All connection attempts failed');
  console.log('\n🔧 Please check:');
  console.log('1. MongoDB Atlas user exists: saijeevan362');
  console.log('2. Password is correct: JeevanSai@123');
  console.log('3. IP address is whitelisted in Network Access');
  console.log('4. Cluster is running and accessible');
  
  return null;
}

testConnections(); 