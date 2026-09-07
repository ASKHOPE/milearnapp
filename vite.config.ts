import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function postgresApiPlugin(): Plugin {
  return {
    name: 'postgres-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        try {
          const { serverDb } = await import('./src/services/db/serverDb.js');
          const { validateSyncPayload, validateScrapeRequest } = await import('./src/services/validation/schemas.js');

              // Health Check
              if (req.url === '/api/health') {
                const health = await serverDb.checkHealth();
                res.end(JSON.stringify(health));
                return;
              }

              // Vault Data Dump
              if (req.url === '/api/vault') {
                const data = await serverDb.getVaultData();
                res.end(JSON.stringify(data));
                return;
              }

              // Typing Passages
              if (req.url === '/api/typing-passages') {
                const data = await serverDb.getVaultData();
                res.end(JSON.stringify(data.typingPassages));
                return;
              }

              // Academic Citations
              if (req.url === '/api/citations') {
                const data = await serverDb.getVaultData();
                res.end(JSON.stringify(data.citations));
                return;
              }

              // Dictionary Lexicon
              if (req.url === '/api/dictionary') {
                const data = await serverDb.getVaultData();
                res.end(JSON.stringify({ customWords: data.customWords, abbreviations: data.abbreviations }));
                return;
              }

              // Database Reseed
              if (req.url === '/api/seed' && req.method === 'POST') {
                const { exec } = await import('node:child_process');
                exec('bun run scripts/seed.ts', (err, stdout) => {
                  if (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                  } else {
                    res.end(JSON.stringify({ success: true, message: 'Database reseeded successfully.', output: stdout }));
                  }
                });
                return;
              }

              // Web Content Scraper (Guarded with Zod validation)
              if (req.url?.startsWith('/api/scrape')) {
                const parsedUrl = new URL(req.url!, 'http://localhost');
                const target = parsedUrl.searchParams.get('url');
                
                const validation = validateScrapeRequest({ url: target });
                if (!validation.success) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: validation.error }));
                  return;
                }

                try {
                  const fetchRes = await fetch(validation.data!.url, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                  });
                  const html = await fetchRes.text();
                  res.end(JSON.stringify({ html, url: validation.data!.url, status: fetchRes.status }));
                } catch (err: unknown) {
                  res.statusCode = 502;
                  res.end(JSON.stringify({ error: 'Failed to scrape target URL', details: err instanceof Error ? err.message : String(err) }));
                }
                return;
              }

              // Bi-Directional Sync (Zod runtime validation)
              if (req.url === '/api/sync' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                  try {
                    const payload = JSON.parse(body);
                    const validation = validateSyncPayload(payload);
                    if (!validation.success) {
                      res.statusCode = 400;
                      res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Payload schema validation failed', 
                        details: validation.error,
                        fieldErrors: validation.fieldErrors 
                      }));
                      return;
                    }

                    if (payload.note) {
                      await serverDb.syncNote(payload.note);
                    }
                    if (payload.folder) {
                      await serverDb.syncFolder(payload.folder);
                    }
                    if (payload.workspace) {
                      await serverDb.syncWorkspace(payload.workspace);
                    }
                    if (payload.book) {
                      await serverDb.syncBook(payload.book);
                    }
                    if (payload.flashcard) {
                      await serverDb.syncFlashcard(payload.flashcard);
                    }
                    if (payload.fullSync) {
                      await serverDb.fullSync(payload.fullSync);
                    }
                    res.end(JSON.stringify({ success: true }));
                  } catch (err: unknown) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
                  }
                });
                return;
              }

              // Password Hashing Endpoint (Bcrypt)
              if (req.url === '/api/auth/hash' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                  try {
                    const { password } = JSON.parse(body);
                    if (!password || typeof password !== 'string') {
                      res.statusCode = 400;
                      res.end(JSON.stringify({ error: 'Password string required' }));
                      return;
                    }
                    const { passwordService } = await import('./src/services/db/passwordService.js');
                    const hash = await passwordService.hashPassword(password);
                    res.end(JSON.stringify({ success: true, hash }));
                  } catch (err: unknown) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
                  }
                });
                return;
              }

              // Password Verification Endpoint (Bcrypt)
              if (req.url === '/api/auth/verify' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                  try {
                    const { password, hash } = JSON.parse(body);
                    if (!password || !hash) {
                      res.statusCode = 400;
                      res.end(JSON.stringify({ error: 'Password and hash required' }));
                      return;
                    }
                    const { passwordService } = await import('./src/services/db/passwordService.js');
                    const valid = await passwordService.verifyPassword(password, hash);
                    res.end(JSON.stringify({ success: true, valid }));
                  } catch (err: unknown) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
                  }
                });
                return;
              }

              next();
            } catch (err: unknown) {
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
            }
          });
        }
      };
    }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), postgresApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('citation-js') || id.includes('@citation-js')) {
              return 'vendor-citation';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('blockly')) {
              return 'vendor-blockly';
            }
            if (id.includes('@xyflow') || id.includes('@reactflow')) {
              return 'vendor-xyflow';
            }
            if (id.includes('desmos') || id.includes('advanced-calculator')) {
              return 'vendor-math';
            }
            if (id.includes('mermaid')) {
              return 'vendor-mermaid';
            }
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('tesseract.js')) {
              return 'vendor-ocr';
            }
            if (id.includes('pdfjs-dist') || id.includes('epubjs')) {
              return 'vendor-readers';
            }
            if (id.includes('fabric') || id.includes('two.js') || id.includes('perfect-freehand')) {
              return 'vendor-canvas';
            }
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  }
})

