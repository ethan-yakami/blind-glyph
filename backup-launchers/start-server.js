import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function openBrowser(url) {
  exec(`start "" "${url}"`);
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const filePath = resolve(join(root, relative));

      if (!filePath.startsWith(resolve(root)) || !existsSync(filePath)) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not Found');
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': mime[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(String(error));
    }
  });
}

async function listenWithFallback(startPort = 4173) {
  for (let port = startPort; port < 4190; port += 1) {
    const server = createStaticServer();
    const ok = await new Promise((resolveListen) => {
      server.once('error', () => resolveListen(false));
      server.listen(port, '127.0.0.1', () => resolveListen(true));
    });
    if (ok) return { server, port };
  }
  throw new Error('No available port in 4173-4189.');
}

const { port } = await listenWithFallback();
const url = `http://127.0.0.1:${port}/`;
console.log(`Game started: ${url}`);
console.log('Keep this window open. Closing it stops the local server.');
openBrowser(url);
