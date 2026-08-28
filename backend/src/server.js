import express from 'express';
import config from './config/env.js';
import corsMiddleware from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import issuesRouter from './routes/issues.js';
import governmentRouter from './routes/government.js';

const app = express();

// ── Core middleware ──────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/government', governmentRouter);

// ── 404 & Error handlers (must be last) ─────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[server] CivicFix backend running on port ${config.port}`);
  console.log(`[server] Health check → http://localhost:${config.port}/api/health`);
});

export default app;
