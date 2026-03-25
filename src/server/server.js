const app = require('./app');
const env = require('./config/environment');

const PORT = process.env.PORT || 3000;

// For Vercel serverless deployment
if (process.env.VERCEL) {
  // Export the app for Vercel
  module.exports = app;
} else {
  // Local development - start server
  const database = require('./config/database');
  
  async function startServer() {
    try {
      await database.init();
      app.listen(PORT, () => {
        console.log(`\n✅ Server running at http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
  
  startServer();
}
