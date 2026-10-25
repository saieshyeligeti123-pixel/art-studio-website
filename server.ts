import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './src/server/api';
import { initDatabase, db } from './src/server/db';
import { runSeed } from './src/server/seed';
import { validateAuthConfig } from './src/server/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Validate configuration at startup
  validateAuthConfig();

  // Initialize SQLite database schema
  initDatabase();

  // Auto-seed if database is empty or not yet seeded
  const paintingCount = (db.prepare('SELECT COUNT(*) as c FROM paintings').get() as any).c;
  if (paintingCount === 0) {
    console.log('[SQLite] Empty database detected. Running seed importer...');
    await runSeed();
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Serve seed data assets and images directly from public directory
  app.use(express.static(path.resolve(__dirname, 'public')));
  app.use('/seedData', express.static(path.resolve(__dirname, 'public/seedData')));

  // Mount the comprehensive REST API
  app.use('/api', apiRouter);

  // Dev or Prod mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Art Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Art Studio] Failed to start server:', err);
  process.exit(1);
});
