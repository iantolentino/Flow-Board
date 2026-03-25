const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupVercel() {
  console.log('🔧 Setting up MyBoard for Vercel...');
  
  // Create data directory
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
  }
  
  // Initialize SQLite database
  const dbPath = path.join(dataDir, 'myboard.db');
  console.log(`📁 Database path: ${dbPath}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_guest INTEGER DEFAULT 0,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT CHECK(status IN ('todo', 'inprogress', 'done')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS vault_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      site_name TEXT NOT NULL,
      username TEXT NOT NULL,
      password_encrypted TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS budget_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date DATE NOT NULL,
      type TEXT CHECK(type IN ('Expense', 'Savings')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS budget_totals (
      user_id TEXT PRIMARY KEY,
      total_money REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id ON vault_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_budget_entries_user_id ON budget_entries(user_id);
  `);
  
  console.log('✅ Database tables created');
  await db.close();
  
  // Create .vercel directory if needed
  const vercelDir = path.join(__dirname, '../.vercel');
  if (!fs.existsSync(vercelDir)) {
    fs.mkdirSync(vercelDir, { recursive: true });
  }
  
  console.log('\n🎉 Vercel setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: vercel login');
  console.log('   2. Run: vercel --prod');
  console.log('   3. Visit your deployed URL\n');
}

setupVercel().catch(console.error);
