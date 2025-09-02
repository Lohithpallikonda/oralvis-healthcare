const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, 'database.db');

// Initialize database connection
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

console.log('Initializing OralVis Healthcare Database...');

try {
  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Technician', 'Dentist')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create scans table
  const createScansTable = `
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      patientId TEXT NOT NULL,
      scanType TEXT NOT NULL DEFAULT 'RGB',
      region TEXT NOT NULL CHECK (region IN ('Frontal', 'Upper Arch', 'Lower Arch')),
      imageUrl TEXT NOT NULL,
      uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploadedBy INTEGER,
      FOREIGN KEY (uploadedBy) REFERENCES users(id)
    )
  `;

  // Execute table creation
  db.exec(createUsersTable);
  console.log('✅ Users table created successfully');

  db.exec(createScansTable);
  console.log('✅ Scans table created successfully');

  // Check if default users already exist
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (checkUsers.count === 0) {
    console.log('Creating default users...');
    
    // Hash passwords for default users
    const technicianPassword = bcrypt.hashSync('technician123', 10);
    const dentistPassword = bcrypt.hashSync('dentist123', 10);
    
    // Insert default users
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, role) 
      VALUES (?, ?, ?)
    `);
    
    // Create default Technician
    insertUser.run('technician@oralvis.com', technicianPassword, 'Technician');
    console.log('✅ Default Technician created: technician@oralvis.com / technician123');
    
    // Create default Dentist
    insertUser.run('dentist@oralvis.com', dentistPassword, 'Dentist');
    console.log('✅ Default Dentist created: dentist@oralvis.com / dentist123');
    
  } else {
    console.log('ℹ️  Default users already exist, skipping creation');
  }

  // Display table schemas for verification
  console.log('\n📋 Database Schema Verification:');
  
  const usersSchema = db.prepare("PRAGMA table_info(users)").all();
  console.log('\nUsers table structure:');
  usersSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  const scansSchema = db.prepare("PRAGMA table_info(scans)").all();
  console.log('\nScans table structure:');
  scansSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });

  console.log('\n🎉 Database initialization completed successfully!');
  console.log(`📂 Database file created at: ${dbPath}`);

} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
} finally {
  // Close database connection
  db.close();
}