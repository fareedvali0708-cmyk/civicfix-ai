import cors from 'cors';

/**
 * CORS configuration.
 * In production, restrict `origin` to the actual frontend domain.
 */
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export default cors(corsOptions);
