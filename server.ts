import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CONFIG } from './server/config';
import { getDatabase } from './server/db';
import { seedDatabase } from './server/scripts/seedDb';
import { preventPrototypePollution } from './server/middleware';

import { authRouter } from './server/routes/authRoutes';
import { productRouter } from './server/routes/productRoutes';
import { companyRouter } from './server/routes/companyRoutes';
import { contentRouter } from './server/routes/contentRoutes';
import { seoRouter } from './server/routes/seoRoutes';
import { inquiryRouter } from './server/routes/inquiryRoutes';
import { systemRouter } from './server/routes/systemRoutes';
import { mediaRouter } from './server/routes/mediaRoutes';

async function startServer() {
  const app = express();

  // 0. Explicit Trust Proxy Configuration for Reverse Proxy (Nginx) Architecture
  app.set('trust proxy', CONFIG.TRUST_PROXY);

  // 1. Core Parsers & Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser(CONFIG.COOKIE_SECRET));
  app.use(preventPrototypePollution);

  // 2. Global Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 2.1 Static Uploads Directory for Media Assets
  const uploadDir = path.join(path.dirname(CONFIG.DATABASE_PATH), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir, {
    setHeaders(res, file) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (file.endsWith('.pdf')) {
        res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  }));
  app.use('/uploads', (_req, res) => { res.status(404).end(); });

  // 3. Initialize SQLite Database & Seed Canonical Bearings
  try {
    getDatabase();
    seedDatabase(false);
  } catch (err) {
    throw new Error('Database startup initialization failed', { cause: err });
  }

  // 4. API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Polad Charkhesh API',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/company', companyRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/seo', seoRouter);
  app.use('/api/inquiries', inquiryRouter);
  app.use('/api/system', systemRouter);
  app.use('/api/media', mediaRouter);

  app.use('/api', (_req, res) => { res.status(404).json({ error: 'API route not found' }); });


  // 5. Frontend Delivery: Vite middleware in Dev vs Static bundle in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/assets', (_req, res) => { res.status(404).end(); });
    // Express 5 catch-all syntax
    app.get('*all', (req, res) => {
      res.sendFile('index.html', { root: distPath });
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'File or request exceeds size limit' : status === 400 ? 'Invalid JSON' : 'Internal server error' });
  });

  // 6. Listen on the configured interface and port.
  app.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`✓ Polad Charkhesh server running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`  Environment: ${CONFIG.NODE_ENV}`);
    console.log(`  Database: ${CONFIG.DATABASE_PATH}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
