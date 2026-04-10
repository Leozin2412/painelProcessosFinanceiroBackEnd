import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Export general environment configurations EXCEPT for Supabase credentials.
export default {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
