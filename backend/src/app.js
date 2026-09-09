import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './routes/index.js';
import { generalApiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendError } from './utils/response.js';
import { env } from './config/env.js';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// CORS configuration supporting credentials (cookies)
app.use(
  cors({
    origin: (origin, callback) => {
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

// Parse JSON & URL-encoded payloads with 50mb capacity
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Parse Cookies
app.use(cookieParser());

// Serve Static Uploaded Files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
