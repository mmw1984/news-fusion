import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.resolve('web/content/articles');
const SOURCES_FILE = path.resolve('web/content/sources.json');
const OUT_DIR = path.resolve('web/dist');

async function loadSources() {
  try {
    const raw = await fs.readFile(SOURCES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  return [];
}

async function listMarkdown(dir) {
  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results = results.concat(await listMarkdown(full));
    else if (e.isFile() && full.endsWith('.md')) results.push(full);
  }
  return results.sort();
}

function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  let body = content;
  if (fmMatch) {
    const fm = fmMatch[1];
    body = content.slice(fmMatch[0].length);
    for (const line of fm.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
      if (m) meta[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  }
  return { meta, body };
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMarkdown(md){
  const lines = md.replace(/\r/g,'').split('\n');
  let out = '';
  let inList = false;
  for (let i=0;i<lines.length;i++){
    let line = lines[i];
    if (/^\s*$/.test(line)) { if(inList){ out += '</ul>'; inList=false;} continue; }
    // headers
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h){ if(inList){ out += '</ul>'; inList=false;} const lvl=h[1].length; out += `<h${lvl}>${inlineMarkdown(h[2])}</h${lvl}>`; continue; }
    // unordered list
    const li = line.match(/^\s*[-\*]\s+(.*)$/);
    if (li){ if(!inList){ inList=true; out += '<ul>'; } out += `<li>${inlineMarkdown(li[1])}</li>`; continue; }
    // image only line
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (img && line.trim() === img[0]){ if(inList){ out += '</ul>'; inList=false;} out += `<p><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" style="max-width:100%"/></p>`; continue; }
    // paragraph (collect following non-empty lines)
    let para = line;
    while(i+1<lines.length && lines[i+1].trim() !== '' && !lines[i+1].match(/^(#{1,3})\s+/) && !lines[i+1].match(/^\s*[-\*]\s+/)){
      i++; para += ' ' + lines[i].trim();
    }
    if(inList){ out += '</ul>'; inList=false; }
    out += `<p>${inlineMarkdown(para)}</p>`;
  }
  if(inList) out += '</ul>';
  return out;
}

function inlineMarkdown(text){
  // images
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_,alt,src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="max-width:100%"/>`);
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_,t,h) => `<a href="${escapeHtml(h)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t)}</a>`);
  // bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return text;
}

function detectSourceId(meta, sources){
  const rawSource = (meta.source || '').toString().trim().toLowerCase();
  if (rawSource && sources.some((source) => source.id === rawSource)) {
    return rawSource;
  }

  let host = '';
  try {
    host = new URL(meta.sourceUrl || '').hostname.toLowerCase();
  } catch {}

  if (host) {
    const matched = sources.find((source) =>
      (source.domains || []).some((domain) => host === domain || host.endsWith(`.${domain}`)),
    );
    if (matched) return matched.id;
  }

  return 'other';
}

function sourceLabel(sourceId, meta, sources){
  const configured = sources.find((source) => source.id === sourceId);
  if (configured?.name) return configured.name;
  if (meta.sourceName) return meta.sourceName;
  return sourceId;
}

async function build(){
  await fs.mkdir(OUT_DIR, { recursive: true });
  const files = await listMarkdown(CONTENT_DIR).catch(()=>[]);
  const sourcesConfig = await loadSources();
  const articles = [];
  for(const f of files){
    const raw = await fs.readFile(f, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const html = renderMarkdown(body);
    const id = path.basename(f, '.md');
    const sourceId = detectSourceId(meta, sourcesConfig);
    articles.push({ id, meta, html, raw, sourceId });
  }

  const sourceIds = Array.from(new Set(articles.map((a) => a.sourceId)));
  const configuredOptions = sourcesConfig
    .filter((source) => sourceIds.includes(source.id))
    .map((source) => ({ value: source.id, label: source.name }));
  const fallbackOptions = sourceIds
    .filter((id) => !sourcesConfig.some((source) => source.id === id))
    .map((id) => ({ value: id, label: id }));
  const sourceOptions = [...configuredOptions, ...fallbackOptions];

  const page = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>News Fusion — Static</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:#f8fafc;color:#0f172a;padding:24px}
    .item{border-bottom:1px solid #e6e6e6;padding:12px 0}
    img{max-width:100%}
    .controls{display:flex;gap:8px;align-items:center;margin-bottom:12px}
    .search{flex:1}
  </style>
</head>
<body>
  <h1>News Fusion (single-file)</h1>
  <div class="controls">
    <select id="sourceSelect"><option value="all">All sources</option>${sourceOptions.map((source)=>`<option value="${escapeHtml(source.value)}">${escapeHtml(source.label)}</option>`).join('')}</select>
    <input id="q" class="search" placeholder="Search..." />
    <button id="refresh" onclick="location.reload()">Refresh</button>
  </div>
  <div id="count"></div>
  <div id="list">
    ${articles.map(a=>`<div class="item" data-source="${escapeHtml(a.sourceId)}">
      <h2>${escapeHtml(a.meta.title||a.id)}</h2>
      <p style="color:#64748b">${escapeHtml(sourceLabel(a.sourceId, a.meta, sourcesConfig))} · ${escapeHtml(a.meta.publishedAt||'')}</p>
      <div class="content">${a.html}</div>
      </div>`).join('\n')}
  </div>
  <script>
    const list = document.getElementById('list');
    const items = Array.from(list.children);
    const q = document.getElementById('q');
    const source = document.getElementById('sourceSelect');
    function update(){
      const qs = q.value.trim().toLowerCase();
      const sv = source.value;
      let visible = 0;
      for(const it of items){
        const text = it.innerText.toLowerCase();
        const s = it.getAttribute('data-source');
        const match = (sv==='all' || s===sv) && (qs==='' || text.includes(qs));
        it.style.display = match ? '' : 'none';
        if(match) visible++;
      }
      document.getElementById('count').innerText = visible + ' articles';
    }
    q.addEventListener('input', update);
    source.addEventListener('change', update);
    update();
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(OUT_DIR, 'index.html'), page, 'utf8');
  // write a simple 404
  await fs.writeFile(path.join(OUT_DIR, '404.html'), '<!doctype html><meta charset="utf-8"><title>404</title><h1>404</h1><p>Not found</p>', 'utf8');
  console.log('Built', articles.length, 'articles ->', OUT_DIR);
}

build().catch(e=>{ console.error(e); process.exit(1); });
