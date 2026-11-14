import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function computeSrcFingerprint(rootDir: string): string {
  const hash = crypto.createHash('md5');
  const indexHtml = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    hash.update('index.html:');
    hash.update(fs.readFileSync(indexHtml));
  }
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        hash.update(path.relative(rootDir, full) + ':');
        hash.update(fs.readFileSync(full));
      }
    }
  };
  walk(path.join(rootDir, 'src'));
  return hash.digest('hex');
}

function buildFingerprintPlugin(): Plugin {
  return {
    name: 'vite-plugin-esmart-build-fingerprint',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        if (fs.existsSync(distDir)) {
          const fp = computeSrcFingerprint(__dirname);
          fs.writeFileSync(path.join(distDir, '.build-fingerprint'), fp, 'utf8');
          // Mirror dist/ into dev-dist/client/ so the built bundle survives Cloud Run container restarts
          const persistentClientDir = path.resolve(__dirname, 'dev-dist', 'client');
          fs.rmSync(persistentClientDir, { recursive: true, force: true });
          fs.mkdirSync(path.dirname(persistentClientDir), { recursive: true });
          fs.cpSync(distDir, persistentClientDir, { recursive: true, force: true });
        }
      } catch (e) {
        console.warn('Could not persist build bundle to dev-dist/client:', e);
      }
    },
  };
}

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      aistudioMediaPlugin(),
      buildFingerprintPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'lucide-react': path.resolve(__dirname, 'src/lib/lucide-bundle.js'),
      },
    },
    esbuild: {
      sourcemap: false,
      legalComments: 'none' as const,
    },
    css: {
      devSourcemap: false,
    },
    optimizeDeps: {
      holdUntilCrawlEnd: false,
      esbuildOptions: {
        minify: true,
        sourcemap: false,
        legalComments: 'none' as const,
      },
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router',
      ],
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
