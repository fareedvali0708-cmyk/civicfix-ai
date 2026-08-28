import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load primary backend .env if it exists
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 2. Load frontend .env as fallback for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
dotenv.config({ path: path.resolve(__dirname, '../../../frontend/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  null;

const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
    anonKey: supabaseAnonKey,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.supabase.url) {
  console.warn('[config] WARNING: SUPABASE_URL / VITE_SUPABASE_URL is not set.');
}

if (!config.supabase.serviceRoleKey) {
  console.warn('[config] NOTICE: SUPABASE_SERVICE_ROLE_KEY is not set in backend environment. Internal agent writes will use anon key.');
}

export default config;
