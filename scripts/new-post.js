import fs from 'node:fs/promises';
import path from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "Post title"');
  process.exit(1);
}

const slug = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const date = new Date().toISOString().slice(0, 10);
const file = path.join(process.cwd(), 'posts', `${date}-${slug}.md`);
try {
  await fs.access(file);
  throw new Error(`Post already exists: ${file}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await fs.writeFile(file, `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\ncategory: blog\nsummary: ''\n---\n\nWrite your post in Markdown. Use $...$ for inline math and $$...$$ for display math.\n`);
console.log(`Created ${path.relative(process.cwd(), file)}`);
