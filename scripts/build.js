import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

const root = process.cwd();
const postsDir = path.join(root, 'posts');
const outputDir = path.join(root, 'dist');
const basePath = (process.env.SITE_BASE_PATH || '').replace(/\/$/, '');
const siteUrl = (pathname) => `${basePath}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItAttrs);

markdown.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index];
  const language = token.info.trim();
  if (language === 'plotly') {
    const id = `plot-${index}`;
    let chart;
    try {
      chart = JSON.parse(token.content);
    } catch (error) {
      throw new Error(`Invalid Plotly JSON in ${id}: ${error.message}`);
    }
    return `<div class="plotly-chart" id="${id}" data-chart="${escapeAttribute(JSON.stringify(chart))}"></div>`;
  }
  const escaped = markdown.utils.escapeHtml(token.content);
  const className = language ? ` class="language-${markdown.utils.escapeHtml(language)}"` : '';
  return `<pre><code${className}>${escaped}</code></pre>`;
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

function shell(title, content, { charts = false } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | al's blog</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${siteUrl('/style.css')}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">
  </head>
  <body>
    <header class="site-header">
      <h1 class="site-name">alvaro's blog</h1>
      <p class="tagline">personal project space</p>
    </header>
    
    ${content}
    
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" crossorigin="anonymous"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js" crossorigin="anonymous" onload="renderMathInElement(document.body, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});"></script>
    ${charts ? `<script defer src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script><script defer src="${siteUrl('/charts.js')}"></script>` : ''}
  </body>
</html>
`;
}

const files = (await fs.readdir(postsDir)).filter((name) => name.endsWith('.md'));
const posts = [];
for (const file of files) {
  const source = await fs.readFile(path.join(postsDir, file), 'utf8');
  const { data, content } = matter(source);
  if (!data.title || !data.date || !['blog', 'project'].includes(data.category)) {
    throw new Error(`${file} needs title, date, and category (blog or project) front matter.`);
  }
  const slug = slugify(data.slug || data.title);
  posts.push({ ...data, slug, content, file });
}
posts.sort((a, b) => b.date.localeCompare(a.date));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.cp(path.join(root, 'style.css'), path.join(outputDir, 'style.css'));
await fs.writeFile(path.join(outputDir, 'charts.js'), `document.querySelectorAll('.plotly-chart').forEach((element) => {\n  const chart = JSON.parse(element.dataset.chart);\n  Plotly.newPlot(element, chart.data, chart.layout, { responsive: true });\n});\n`);

for (const post of posts) {
  const postDir = path.join(outputDir, post.category === 'project' ? 'projects' : 'blogs', post.slug);
  await fs.mkdir(postDir, { recursive: true });
  const html = `<main class="article"><p><a href="${siteUrl('/')}">← Home</a></p><article><h1>${escapeHtml(post.title)}</h1><p class="date">${escapeHtml(formatDate(post.date))}</p>${markdown.render(post.content)}</article></main>`;
  const hasCharts = post.content.includes('```plotly');
  await fs.writeFile(path.join(postDir, 'index.html'), shell(post.title, html, { charts: hasCharts }));
}

const archive = (category) => {
  const entries = posts.filter((post) => post.category === category);
  return entries.length
    ? entries.map((post) => `<div class="post"><a href="${siteUrl(`/${category === 'project' ? 'projects' : 'blogs'}/${post.slug}/`)}">${escapeHtml(post.title)}</a><div class="date">${escapeHtml(formatDate(post.date))}</div></div>`).join('\n')
    : '<div class="post">Nothing to see here</div>';
};

let home = await fs.readFile(path.join(root, 'index.html'), 'utf8');
for (const category of ['project', 'blog']) {
  const label = category === 'project' ? 'PROJECT' : 'BLOG';
  const marker = new RegExp(`<!-- ${label}_ARCHIVE_START -->[\\s\\S]*?<!-- ${label}_ARCHIVE_END -->`);
  if (!marker.test(home)) throw new Error(`index.html is missing the ${category} archive markers.`);
  home = home.replace(marker, `<!-- ${label}_ARCHIVE_START -->\n        ${archive(category)}\n        <!-- ${label}_ARCHIVE_END -->`);
}
home = home.replace('href="style.css"', `href="${siteUrl('/style.css')}"`);
home = home.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">\n  </head>');
home = home.replace('</body>', `    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" crossorigin="anonymous"></script>\n    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js" crossorigin="anonymous" onload="renderMathInElement(document.body, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});"></script>\n  </body>`);
await fs.writeFile(path.join(outputDir, 'index.html'), home);
console.log(`Built ${posts.length} post(s) into dist/.`);
