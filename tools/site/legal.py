#!/usr/bin/env python3
"""Builds /terms/ and /privacy/ from docs/terms.md and docs/privacy.md.

Run from the repo root after changing either document: python3 tools/site/legal.py
Everything from "## Notes for the reviewer" on is left out of the page.
The page's menu and footer are taken from public/pricing/index.html.
"""
import html, re

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\b(webaccessbuilder@gmail\.com)\b', r'<a href="mailto:\1">\1</a>', t)
    return t

def body(md):
    md = md.split('## Notes for the reviewer')[0].rstrip().rstrip('-').rstrip()
    out, lines, i = [], md.split('\n'), 0
    while i < len(lines):
        l = lines[i]
        if not l.strip() or l.strip() == '---': i += 1; continue
        m = re.match(r'(#{1,3}) (.*)', l)
        if m:
            n = len(m.group(1)); text = m.group(2)
            if n == 1: i += 1; continue  # the page's own heading
            slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
            out.append(f'<h{n} id="{slug}">{inline(text)}</h{n}>'); i += 1; continue
        if l.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')]); i += 1
            head, rest = rows[0], rows[2:]
            t = '<div class="datasheet-scroll" tabindex="0" role="region" aria-label="Table"><table class="datasheet legal-table"><thead><tr>'
            t += ''.join(f'<th scope="col">{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
            for r in rest: t += '<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>'
            out.append(t + '</tbody></table></div>'); continue
        if re.match(r'(- |\d+\. )', l):
            tag = 'ul' if l.startswith('- ') else 'ol'
            items = []
            while i < len(lines) and re.match(r'(- |\d+\. )', lines[i]):
                items.append(re.sub(r'^(- |\d+\. )', '', lines[i])); i += 1
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + f'</{tag}>'); continue
        out.append(f'<p>{inline(l)}</p>'); i += 1
    return '\n'.join(out)

shell = open('public/pricing/index.html').read()
top = shell[:shell.index('<main id="main">')].replace(' aria-current="page"', '')
foot = shell[shell.index('<footer class="site-footer">'):]

def page(slug, title, lede, desc):
    md = open(f'docs/{slug}.md').read()
    t = re.sub(r'<title>.*?</title>', f'<title>{title} | Web Access Builder</title>', top, flags=re.S)
    t = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + desc, t)
    t = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + title + ' | Web Access Builder', t)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + desc, t)
    t = t.replace('https://webaccessbuilder.com/pricing/', f'https://webaccessbuilder.com/{slug}/')
    main = f'''<main id="main">

<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">{title}</h1>
    <p class="lede">{lede}</p>
  </div>
</section>

<section class="legal">
  <div class="wrap">
    <div class="guide-body legal-body">
{body(md)}
    </div>
  </div>
</section>

</main>

'''
    import os
    os.makedirs(f'public/{slug}', exist_ok=True)
    open(f'public/{slug}/index.html', 'w').write(t + main + foot)

page('terms', 'Terms of use', 'Version 2026-11, 12 November 2026. For business use only.',
     'The terms for using Web Access Builder: the plans, paying, your content, the AI assistant and what happens when an account ends.')
page('privacy', 'Privacy policy', 'What we hold about you, why, who else handles it and how long we keep it.',
     'What Web Access Builder holds about visitors and account holders, why, who else handles it, how long it is kept and your rights.')
