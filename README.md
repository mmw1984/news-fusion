## News Fusion (Frontend Manual Edition)

This repository now ships with a **frontend-only** workflow.

This project is based on https://github.com/ckt1031/news-fusion

Repository: https://github.com/mmw1984/news-fusion

- No crawler required
- No database required
- No backend API required for article data
- No automatic news fetching in web runtime

All news entries are maintained manually via markdown files under `web/content/articles`.

## What Changed

- Data source migrated from server API to local markdown files
- Category filtering remains available
- Date filtering remains available
- Source filtering remains available
- Search remains available (Fuse.js)
- In-page markdown reading (images + text) is available in each expanded item
- Article source link and publisher information are shown in each item

## Markdown Format

Create files at:

`web/content/articles/<category>/<yyyy-mm-dd>-<slug>.md`

Example:

```md
---
title: "Open benchmark suite highlights efficiency gains in small language models"
category: "technology"
publishedAt: "2026-02-16T08:10:00Z"
sourceName: "The Verge"
sourceUrl: "https://www.theverge.com/tech/example-model-benchmark"
thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475"
summary: "A new open benchmark suggests that optimized smaller models are closing the performance gap while significantly reducing inference cost."
---
Markdown content here.

![Inline image example](https://example.com/image.jpg)
```

### Required Frontmatter Fields

- `title`
- `category`
- `publishedAt`
- `sourceUrl`

### Optional Frontmatter Fields

- `sourceName`
- `thumbnail`
- `summary`

If `summary` is omitted, the app auto-generates a short summary from markdown body text.

## High-Frequency Update Workflow

If you update content very often, use the helper command to create a ready-to-edit markdown file instantly.

```bash
npm run article:new -- --title "Your title" --category technology --sourceUrl "https://example.com/article" --sourceName "The Verge" --summary "Short summary"
```

Positional mode (fast copy/paste):

```bash
npm run article:new -- Your title technology https://example.com/article TheVerge Short summary text
```

The command will:

- auto-generate filename using date + slug
- auto-create category folder if missing
- prefill frontmatter template

After creation, open the generated file in `web/content/articles/<category>/` and edit the markdown body.

## Supported Categories

Edit categories directly in:

`web/content/categories.json`

Default values:

- `world`
- `business`
- `technology`
- `product`
- `software`
- `politics`

## Local Deployment

### 1) Install dependencies

Use your preferred package manager:

```bash
bun install
```

or

```bash
npm install
```

If npm reports peer dependency conflict in your environment, use:

```bash
npm install --legacy-peer-deps
```

### 2) Start dev server

```bash
bun run nuxt:dev
```

or

```bash
npm run nuxt:dev
```

Then open `http://localhost:3000`.

### 3) Build static frontend

```bash
bun run nuxt:generate
```

Generated static files are output to Nuxt's generate output directory.

## Deploy to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy-pages.yml` that builds and deploys automatically on push to `main`.

### 1) Prepare repository settings (one-time)

In GitHub repository settings:

- Go to **Settings → Pages**
- In **Build and deployment**, select **Source: GitHub Actions**

### 2) Push to main branch

```bash
git push origin main
```

The workflow will:

- install dependencies with `npm ci --legacy-peer-deps`
- generate static files via `npm run nuxt:generate`
- deploy `web/.output/public` to GitHub Pages

### 3) Base path behavior

- For `username.github.io` repository, base path is `/`
- For project repository (for example `news-fusion`), base path is `/<repo-name>/`

This is handled automatically by the workflow using `NUXT_APP_BASE_URL`.

### 4) Local preview with project base path (optional)

If you want to preview the same path behavior as project Pages locally:

PowerShell:

```powershell
$env:NUXT_APP_BASE_URL='/news-fusion/'; npm run nuxt:generate
```

Then serve `web/.output/public` with any static server.

## Notes

- Current crawler/database scripts are still present in the repo for legacy reference.
- The web UI in this edition reads article content from local markdown only.
- Repository ships with no seeded news entries; all news content is manually added by you.
