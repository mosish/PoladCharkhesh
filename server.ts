import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
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

async function startServer() {
  const app = express();

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

  // 3. Initialize SQLite Database & Seed Canonical Bearings
  try {
    getDatabase();
    seedDatabase(false);
  } catch (err) {
    console.error('Database startup initialization failed:', err);
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
    // Express 5 catch-all syntax
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Listen on Port 3000 and Host 0.0.0.0
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
