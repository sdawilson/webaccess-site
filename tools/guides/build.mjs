// Builds the website's Guides pages from the app's Markdown guides.
//
//   node tools/guides/build.mjs <docs folder> <output folder>
//   e.g. node tools/guides/build.mjs ../webaccess/docs public/guides
//
// Each guide becomes <output>/<slug>/index.html, served at /guides/<slug>. Links between the
// guides are rewritten to the site's addresses; links to files that aren't published (the
// docs README and changelog, anything on GitHub) keep their text and lose the link, and a
// paragraph that is only about the repository's own workflows is left out.
import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';

const [, , docsDir, outDir] = process.argv;
if (!docsDir || !outDir) {
  console.error('usage: node tools/guides/build.mjs <docs folder> <output folder>');
  process.exit(2);
}

// The guides that are published, in the order the site lists them.
const GUIDES = [
  {
    file: 'user-guide.md', slug: 'user-guide', title: 'User guide',
    blurb: 'Using and designing databases: tables, queries, forms, reports, PivotTable and PivotChart views, import and export, and users.',
  },
  {
    file: 'programmers-guide.md', slug: 'programmers-guide', title: "Programmer's guide",
    blurb: 'Writing code: the code window, VBA as it is implemented, events, Me, DoCmd, DAO, the SQL dialect, debugging and JavaScript modules.',
  },
  {
    file: 'access-differences.md', slug: 'access-differences', title: 'Compared with Access',
    blurb: 'What is the same as Microsoft Access, what is different, what is missing and what is new, especially in VBA.',
  },
];
const BY_FILE = new Map(GUIDES.map((g) => [g.file, g]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (md) => md.replace(/`([^`]*)`/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '');

// GitHub's heading anchors, so the guides' own #links keep working.
function slugger() {
  const seen = new Map();
  return (text) => {
    let s = plain(text).toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const n = seen.get(s) || 0;
    seen.set(s, n + 1);
    if (n) s = `${s}-${n}`;
    return s;
  };
}

// Leaves out the Markdown "## Contents" section (the page has its own) and paragraphs that
// are only about the repository's workflows.
function prepare(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let skipping = false;
  for (const line of lines) {
    if (/^##\s+Contents\s*$/i.test(line)) { skipping = true; continue; }
    if (skipping && /^#{1,2}\s/.test(line)) skipping = false;
    if (!skipping) out.push(line);
  }
  return out.join('\n')
    .split(/\n{2,}/)
    .filter((para) => !/\.github\/|github\.com|docs\/README\.md|update-docs/i.test(para))
    .join('\n\n');
}

// Where a link in a guide should point on the site, or null to drop the link.
function rewriteHref(href) {
  if (/^(https?:|mailto:)/i.test(href)) return /github\.com|ghcr\.io/i.test(href) ? null : href;
  if (href.startsWith('#')) return href;
  const [file, hash] = href.split('#');
  const g = BY_FILE.get(path.basename(file));
  if (g) return `/guides/${g.slug}/${hash ? `#${hash}` : ''}`;
  return null; // README, CHANGELOG, source files: not published
}

function render(md) {
  const slug = slugger();
  const toc = [];
  let h1 = '';
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1) { h1 = plain(text); return `<h1>${inner}</h1>\n`; }
        const id = slug(text);
        if (depth === 2) toc.push({ id, text: plain(text) });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const to = rewriteHref(href);
        if (to === null) return inner;
        const ext = /^https?:/i.test(to) ? ' rel="noopener" target="_blank"' : '';
        return `<a href="${esc(to)}"${title ? ` title="${esc(title)}"` : ''}${ext}>${inner}</a>`;
      },
      html({ text }) {
        // Images in raw HTML (the logo at the top of each guide, for GitHub) are left out: the
        // site's header has the logo, and their paths point into the app's repo.
        if (/^(\s*<\/?(img|p|div|picture|source|br)\b[^>]*>)+\s*$/i.test(text)) return '';
        return esc(text); // the guides are Markdown; show any other stray HTML as text rather than run it
      },
    },
  });
  let html = marked.parse(md);
  html = html
    .replace(/<table>/g, '<div class="datasheet-scroll" tabindex="0"><table class="datasheet">')
    .replace(/<\/table>/g, '</table></div>')
    .replace(/<th align="(left|right|center)">/g, '<th class="al-$1">')
    .replace(/<td align="(left|right|center)">/g, '<td class="al-$1">');
  return { html, toc, h1 };
}

// ---------- page template (matches public/index.html) ----------

const head = (title, description, canonical) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Web Access Builder</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://webaccessbuilder.com${canonical}">
<meta name="theme-color" content="#1f4e3d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/brand/logo-mark-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="titlebar">
  <div class="titlebar-inner">
    <a class="wordmark" href="/"><img src="/img/brand/logo-white.svg" alt="Web Access Builder" width="256" height="26"></a>
    <nav aria-label="Main">
      <ul>
        <li><a href="/features/">Features</a></li>
        <li><a href="/vba/">Visual Basic</a></li>
        <li><a href="/excel/">From Excel</a></li>
        <li><a href="/access/">From Access</a></li>
        <li><a href="/pricing/">Pricing</a></li>
        <li><a href="/guides/" aria-current="page">Guides</a></li>
      </ul>
    </nav>
    <a class="btn btn-light" href="https://app.webaccessbuilder.com/signup" data-signup data-hit="signup">Start free</a>
  </div>
</header>
`;

const foot = `
<footer class="site-footer">
  <div class="wrap footer-grid">
    <p class="wordmark wordmark-small"><img src="/img/brand/logo-white.svg" alt="Web Access Builder" width="197" height="20"></p>
    <p>© 2026 Simon Wilson. Microsoft, Access, Excel and Visual Basic are trademarks of Microsoft Corporation. Web Access Builder is an independent product and isn't affiliated with or endorsed by Microsoft.</p>
    <p class="footer-links"><a href="/features/">Features</a> <a href="/vba/">Visual Basic</a> <a href="/excel/">From Excel</a> <a href="/access/">From Access</a> <a href="/pricing/">Pricing</a> <a href="/screenshots/">Screenshots</a> <a href="/guides/">Guides</a> <a href="/features/#suggest">Suggest a feature</a> <a href="/pricing/#contact">Contact</a> <a href="/terms/">Terms</a> <a href="/privacy/">Privacy</a></p>
  </div>
</footer>
<script src="/js/admin-link.js" defer></script>
</body>
</html>
`;

function guidePage(g, { html, toc }) {
  const others = GUIDES.map((o) => `<li><a href="/guides/${o.slug}/"${o === g ? ' aria-current="page"' : ''}>${esc(o.title)}</a></li>`).join('');
  const onPage = toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('');
  return head(g.title, g.blurb, `/guides/${g.slug}/`) + `
<main id="main" class="guide">
  <div class="wrap guide-grid">
    <aside class="guide-side" aria-label="Guides">
      <details class="guide-nav" open>
        <summary>Guides and contents</summary>
        <p class="guide-nav-head"><a href="/guides/">Guides</a></p>
        <ul class="guide-list">${others}</ul>
        <p class="guide-nav-head">On this page</p>
        <ol class="guide-toc">${onPage}</ol>
      </details>
    </aside>
    <article class="guide-body">
${html}
    </article>
  </div>
</main>
<script src="/js/guides.js" defer></script>
` + foot;
}

function indexPage() {
  const items = GUIDES.map((g) => `
      <li>
        <h2><a href="/guides/${g.slug}/">${esc(g.title)}</a></h2>
        <p>${esc(g.blurb)}</p>
      </li>`).join('');
  return head('Guides', 'How to use Web Access Builder: the user guide, the programmer\'s guide, and how it compares with Microsoft Access.', '/guides/') + `
<main id="main" class="guides-index">
  <div class="wrap">
    <div class="section-head">
      <h1>Guides</h1>
      <p>They assume you know Microsoft Access, and say where Web Access Builder works differently.</p>
    </div>
    <ul class="guide-cards">${items}
    </ul>
  </div>
</main>
` + foot;
}

// ---------- build ----------

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const built = [];
for (const g of GUIDES) {
  const src = path.join(docsDir, g.file);
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exit(1);
  }
  const page = render(prepare(fs.readFileSync(src, 'utf8')));
  if (page.html.length < 2000) {
    console.error(`${g.file} came out suspiciously short (${page.html.length} characters)`);
    process.exit(1);
  }
  fs.mkdirSync(path.join(outDir, g.slug), { recursive: true });
  fs.writeFileSync(path.join(outDir, g.slug, 'index.html'), guidePage(g, page));
  built.push(`${g.slug} (${page.toc.length} sections)`);
}
fs.writeFileSync(path.join(outDir, 'index.html'), indexPage());
console.log(`Built the guides: ${built.join(', ')}`);
