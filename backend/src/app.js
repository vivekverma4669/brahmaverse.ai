import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './docs/openapi.js';
import { config } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/authRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin))
          callback(null, true);
        else callback(new ApiError(403, 'Origin is not allowed.'));
      },
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.get('/api-docs.json', (_req, res) => res.json(openapi));
  // Permit Swagger's inline bootstrap/styles only on the documentation routes.
  // Disable HTTPS upgrades here so local HTTP review works in every browser.
  app.use('/api-docs', helmet({
    contentSecurityPolicy: { directives: {
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'upgrade-insecure-requests': null,
    } },
  }), swaggerUi.serve, swaggerUi.setup(openapi, {
    customSiteTitle: 'CRM Assignment API Docs',
    swaggerOptions: { validatorUrl: null, persistAuthorization: false },
  }));
  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res
      .status(connected ? 200 : 503)
      .json({
        success: connected,
        data: {
          status: connected ? 'ok' : 'unavailable',
          database: connected ? 'connected' : 'disconnected',
        },
      });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
export default createApp();
