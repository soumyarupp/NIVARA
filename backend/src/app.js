import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { generalApiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendError } from './utils/response.js';
import { env } from './config/env.js';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false // Allows API to serve flexibly in cross-origin SPA setups
  })
);

// CORS configuration supporting credentials (cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching FRONTEND_URL
      if (!origin || origin === env.FRONTEND_URL || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not permitted by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Parse JSON & URL-encoded payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Parse Cookies
app.use(cookieParser());

// Apply global rate limiting to all endpoints except in test mode
if (env.NODE_ENV !== 'test') {
  app.use('/api', generalApiLimiter);
}

// Mount API routes
app.use('/api', routes);

// 404 Route Handler
app.use((req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found.`, [], 404);
});

// Centralized Error Interceptor
app.use(errorHandler);

export default app;
