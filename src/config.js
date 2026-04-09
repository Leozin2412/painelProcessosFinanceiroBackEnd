const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Export general environment configurations EXCEPT for Supabase credentials.
module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
