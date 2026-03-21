const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('Setting up MyBoard...\n');

// Create data directory
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('✓ Created data directory');
}

// Check if .env exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with default values...');
  
  const envContent = `# Auto-generated .env file
NODE_ENV=development
PORT=3000

# Auto-generated secrets
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}

# Database - SQLite is used by default (no PostgreSQL needed!)
USE_SQLITE=true
DATABASE_PATH=./data/myboard.db

# Features
ENABLE_GUEST_MODE=true
LOG_LEVEL=debug
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Created .env file with secure defaults');
}

console.log('\n✅ Setup complete!');
console.log('\nTo start the application:');
console.log('  npm run dev     # Development mode with auto-reload');
console.log('  npm start       # Production mode');
console.log('\nTo run tests:');
console.log('  npm test        # Run all tests');
console.log('  npm run test:unit  # Run unit tests only');
console.log('\nThe application will automatically use SQLite - no database setup needed!');