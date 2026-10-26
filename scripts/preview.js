import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const rootPrefix = `${root}${path.sep}`;
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(rootPrefix)) throw new Error('Invalid path');
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    } catch {
      if (!path.extname(file)) file = path.join(file, 'index.html');
    }
    const content = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(content);
  } catch {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(4173, () => console.log('Preview at http://localhost:4173'));
