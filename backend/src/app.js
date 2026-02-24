const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ── Security headers
app.use(helmet());

// ── CORS
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));

// ── Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Global rate limit (100 req / 15 min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── API v1 routes
app.use('/api/v1', routes);

// ── 404 handler
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));

// ── Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
