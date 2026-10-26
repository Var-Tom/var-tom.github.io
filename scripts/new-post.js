import fs from 'node:fs/promises';
import path from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "Post title"');
  process.exit(1);
}

const slug = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const file = path.join(process.cwd(), 'posts', `${slug}.md`);
try {
  await fs.access(file);
  throw new Error(`Post already exists: ${file}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await fs.writeFile(file, `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\n---\n\nWrite your post in Markdown. Use $...$ for inline math and $$...$$ for display math.\n`);
console.log(`Created ${path.relative(process.cwd(), file)}`);
