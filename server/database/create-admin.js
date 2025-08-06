const { connectToDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');
    const db = await connectToDatabase();
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ 
      role: 'admin', 
      deleted_at: { $exists: false } 
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@capitalrise.com',
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('📝 Admin Credentials:');
    console.log(`   Username: admin`);
    console.log(`   Email: admin@capitalrise.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role: admin`);
    console.log(`   User ID: ${result.insertedId}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser }; 