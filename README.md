# Writing and publishing

## Requirements

Install Node.js, then install the project dependencies once:

```sh
npm install
```

## Create a post

```sh
npm run new-post -- "My post title"
```

This creates a dated Markdown file in `posts/`. Edit its front matter and body. Set `category` to `blog` or `project` to choose where it appears on the homepage.

```yaml
---
title: My post title
date: 2026-10-25
category: blog
summary: A short description
---
```

Write ordinary content in Markdown. KaTeX renders `$x^2$` inline and `$$x^2$$` as a display equation. For an interactive Plotly chart, add a fenced `plotly` block containing a JSON object with `data` and optional `layout` fields. Posts without chart blocks do not load Plotly.

## Read locally

```sh
npm run build
npm run preview
```

Open `http://localhost:4173` in your browser. Click a post title in the Blogs or Projects list to read it. The generated pages are in `dist/`.

## Publish on GitHub Pages

Commit and push the project to GitHub. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The included workflow builds the site and publishes `dist/` whenever you push. Once the workflow finishes, GitHub shows the live address under **Settings → Pages**. For a project repository it usually looks like `https://USERNAME.github.io/REPOSITORY/`; for a repository named `USERNAME.github.io`, it is `https://USERNAME.github.io/`.

After adding or editing a Markdown file in `posts/`, push the change. When deployment finishes, open the site homepage and click the post title. Its address follows `https://USERNAME.github.io/REPOSITORY/blogs/POST-SLUG/` (or `/projects/POST-SLUG/`). Math and interactive charts load from CDNs, so visitors need an internet connection for them to render.

The root `index.html` is the hand-edited homepage template, including its introduction and section headings. The build fills the marked Projects and Blogs archive areas from Markdown post metadata. The root `style.css` is copied into `dist/` and styles the homepage and generated posts.
