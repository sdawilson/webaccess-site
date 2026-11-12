#!/usr/bin/env python3
"""One-off: builds the free-plan site's pages from the pages on main.
Run from the site repo on the free-plan branch. Sections are cut from main's pages by their
<!-- ============ X ============ --> markers, so it can be run again safely."""
import subprocess, re, json

def main_file(p):
    return subprocess.run(['git', 'show', 'main:' + p], capture_output=True, text=True, check=True).stdout

def sections(html):
    """{marker name: html of that section} for a page."""
    parts = re.split(r'<!-- =+ (.+?) =+ -->\n', html)
    out = {}
    for i in range(1, len(parts), 2):
        body = parts[i + 1]
        end = body.find('\n</main>')
        out[parts[i]] = (body if end < 0 else body[:end]).rstrip() + '\n'
    return out

SIGNUP = 'https://app.webaccessbuilder.com/signup'
DEMO = 'https://demo.webaccessbuilder.com'
START = '<a class="btn btn-primary" href="%s" data-signup data-hit="signup">Start free</a>' % SIGNUP
TRY = '<a class="btn btn-ghost" href="%s" data-demo-link data-hit="demo" target="_blank" rel="noopener">Try the demo, no sign-up</a>' % DEMO

NAV = [('/features/', 'Features'), ('/vba/', 'Visual Basic'), ('/excel/', 'From Excel'), ('/access/', 'From Access'), ('/pricing/', 'Pricing'), ('/guides/', 'Guides')]

def head(title, desc, path, og_title=None, extra=''):
    url = 'https://webaccessbuilder.com' + path
    return f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{og_title or title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://webaccessbuilder.com/img/og.png">
<meta property="og:url" content="{url}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1f4e3d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/brand/logo-mark-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
{extra}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
'''

def header(current=''):
    cur = ' aria-current="page"'
    items = '\n'.join(f'        <li><a href="{h}"{cur if h == current else ""}>{t}</a></li>' for h, t in NAV)
    return f'''
<header class="titlebar">
  <div class="titlebar-inner">
    <a class="wordmark" href="/"><img src="/img/brand/logo-white.svg" alt="Web Access Builder" width="256" height="26"></a>
    <nav aria-label="Main">
      <ul>
{items}
      </ul>
    </nav>
    <a class="btn btn-light" href="{SIGNUP}" data-signup data-hit="signup">Start free</a>
  </div>
</header>

<main id="main">
'''

FOOTER = '''
</main>

<footer class="site-footer">
  <div class="wrap footer-grid">
    <p class="wordmark wordmark-small"><img src="/img/brand/logo-white.svg" alt="Web Access Builder" width="197" height="20"></p>
    <p>© 2026 Simon Wilson. Microsoft, Access, Excel and Visual Basic are trademarks of Microsoft Corporation. Web Access Builder is an independent product and isn't affiliated with or endorsed by Microsoft.</p>
    <p class="footer-links"><a href="/features/">Features</a> <a href="/vba/">Visual Basic</a> <a href="/excel/">From Excel</a> <a href="/access/">From Access</a> <a href="/pricing/">Pricing</a> <a href="/screenshots/">Screenshots</a> <a href="/guides/">Guides</a> <a href="/features/#suggest">Suggest a feature</a> <a href="/pricing/#contact">Contact</a></p>
  </div>
</footer>

<script src="/js/site.js" defer></script>
<script src="/js/admin-link.js" defer></script>
</body>
</html>
'''

def cta(title, text, cls='cta-band'):
    return f'''
<section class="{cls}" aria-label="Start free">
  <div class="wrap cta-inner">
    <div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
    <p class="hero-actions">
      {START}
      {TRY}
    </p>
  </div>
</section>
'''

def fix_links(s):
    """Old in-page links that no longer have a home on the page they're on."""
    s = s.replace('href="#request"', 'href="/pricing/#contact"').replace('href="/#request"', 'href="/pricing/#contact"')
    s = s.replace('href="#plans"', 'href="/pricing/"').replace('href="/#plans"', 'href="/pricing/"')
    s = s.replace('href="#demo" data-demo-link', f'href="{DEMO}" data-demo-link data-hit="demo"').replace('href="/#demo" data-demo-link', f'href="{DEMO}" data-demo-link data-hit="demo"')
    return s

home = sections(main_file('public/index.html'))
excel = main_file('public/excel/index.html')
access = main_file('public/access/index.html')

MS_PIVOT = 'https://support.microsoft.com/en-us/office/discontinued-features-and-modified-functionality-in-access-2013-bc006fc3-5b48-499e-8c7d-9a2dfef68e2f'
MS_WEBAPPS = 'https://support.microsoft.com/en-us/access/access-services-in-sharepoint-roadmap'
MS_SCRIPTS = 'https://learn.microsoft.com/en-us/office/dev/scripts/resources/vba-differences'
PHYS = 'https://phys.org/news/2024-08-business-spreadsheets-critical-errors.html'
NLS = 'https://nolongerset.com/will-officescripts-replace-vba/'
ext = lambda url, text: f'<a href="{url}" rel="noopener" target="_blank">{text}</a>'

PLANS = f'''<section class="plans" id="plans" aria-labelledby="plans-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="plans-title">Free to build. Pay when you share it.</h2>
      <p>Build and test on your own for nothing, for as long as you like. When it's ready for your team, one subscription shares each database with up to 10 people.</p>
    </div>
    <div class="plan-grid">
      <article class="plan">
        <h3>Free</h3>
        <p class="plan-price">£0</p>
        <p class="plan-per">No card needed</p>
        <ul class="ticks">
          <li>One database of your own, up to 5,000 records and 10 MB</li>
          <li>Every design tool: worksheets, tables, queries, forms, reports, macros and VBA</li>
          <li>The Fieldfare Traders sample, to take apart</li>
          <li>Preview as User, to see what your team would get</li>
          <li>The AI assistant, with a small monthly allowance</li>
        </ul>
        <p class="plan-cta">{START}</p>
      </article>
      <article class="plan plan-main">
        <h3>Builder</h3>
        <p class="plan-price">£15 <span>a month</span></p>
        <p class="plan-per">or £99 a year, for each Admin</p>
        <ul class="ticks">
          <li>Share each database with up to 10 people, free for them, in the runtime</li>
          <li>More databases, without the free plan's size limit</li>
          <li>Runtime errors reported to you</li>
          <li>Nightly backups, as well as a download at any time</li>
          <li>A larger allowance for the AI assistant</li>
        </ul>
        <p class="plan-cta"><a class="btn btn-ghost" href="/pricing/">Compare the plans</a></p>
      </article>
      <article class="plan">
        <h3>More than 10 people</h3>
        <p class="plan-price">Talk to us</p>
        <p class="plan-per">Per database</p>
        <p>A database that needs more people moves to a hosted SQL database, at a fee that covers its hosting.</p>
        <p class="plan-cta"><a class="btn btn-ghost" href="/pricing/#contact">Get in touch</a></p>
      </article>
    </div>
    <p class="plan-note">You pay for Admins, the people who design. The people you share a database with don't need a licence of their own. Databases are hosted in London.</p>
  </div>
</section>
'''

# =============================================================== home
HOME_LD = json.dumps({
  "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Web Access Builder",
  "applicationCategory": "BusinessApplication", "operatingSystem": "Web browser",
  "description": "A spreadsheet and a database in one: worksheets, forms, reports, PivotTables and VBA on a shared database, in a web browser.",
  "url": "https://webaccessbuilder.com/",
  "offers": [
    {"@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "GBP"},
    {"@type": "Offer", "name": "Builder", "price": "15", "priceCurrency": "GBP", "description": "Per Admin, per month. Up to 10 people use each database free."},
  ],
}, indent=1)

home_html = head(
  'Web Access Builder: spreadsheet and database, together at last',
  'A spreadsheet with a database behind it, in your browser: worksheets, forms, reports, PivotTables and VBA on one shared database. Free to build; share it with your team as your own app.',
  '/',
  extra='<link rel="preload" as="image" href="/img/spreadsheet.webp" imagesrcset="/img/spreadsheet.webp 1136w, /img/spreadsheet@2x.webp 2272w" imagesizes="(min-width: 1000px) 620px, 94vw">\n<script type="application/ld+json">\n' + HOME_LD + '\n</script>\n',
) + header() + f'''
<!-- ============ Hero ============ -->
<section class="hero hero-split" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="eyebrow"><span class="pill">Early access</span> <span class="eyebrow-text">A spreadsheet, a database and VBA, in your browser</span></p>
      <h1 id="hero-title">Spreadsheet and database, together at last.</h1>
      <p class="hero-sub">Design it, then share it with your team as your own app.</p>
      <p class="lede">Keep your worksheets and formulas. Underneath them is a real database, so everyone works on the same records, with forms, reports and pivots on the same data.</p>
      <p class="hero-actions">
        {START}
        {TRY}
      </p>
      <p class="hero-note">Free to build, with no card. <a href="/pricing/">£15 a month</a> when you share it with your team.</p>
    </div>
    <figure class="hero-shot">
      <div class="window">
        <div class="window-bar" aria-hidden="true">
          <span class="dots"><i></i><i></i><i></i></span>
          <span class="address">yourteam.webaccessbuilder.com</span>
        </div>
        <a href="/img/spreadsheet-full@2x.webp" target="_blank" rel="noopener">
          <img src="/img/spreadsheet.webp" srcset="/img/spreadsheet.webp 1136w, /img/spreadsheet@2x.webp 2272w" sizes="(min-width: 1000px) 620px, 94vw" width="1136" height="682" fetchpriority="high"
               alt="A workbook on a form: a stock list whose rows are the records of a database, with low stock shaded and a Stock value column worked out by a formula">
        </a>
      </div>
      <figcaption>A workbook on a form. Its rows are records: change a cell and that record is saved, for everyone.</figcaption>
    </figure>
  </div>
</section>

<!-- ============ Three proofs ============ -->
<section class="proof" aria-labelledby="proof-title">
  <div class="wrap">
    <h2 id="proof-title" class="visually-hidden">What it does</h2>
    <div class="proof-grid">
      <article class="proof-card">
        <a href="/img/spreadsheet-runtime-full@2x.webp" target="_blank" rel="noopener"><img src="/img/spreadsheet-runtime.webp" srcset="/img/spreadsheet-runtime.webp 1136w, /img/spreadsheet-runtime@2x.webp 2272w" sizes="(min-width: 1000px) 360px, 94vw" width="1136" height="682" loading="lazy" alt="The stock workbook as a User sees it, with no design tools"></a>
        <h3>Worksheets on live data</h3>
        <p>A workbook whose rows are a table's or a query's records. Your formulas, formats and layout stay; a changed cell saves its own record. No copies, and no file to lock.</p>
        <p class="more"><a href="/excel/">Coming from Excel</a></p>
      </article>
      <article class="proof-card">
        <a href="/img/pivotchart-full@2x.webp" target="_blank" rel="noopener"><img src="/img/pivotchart.webp" srcset="/img/pivotchart.webp 1136w, /img/pivotchart@2x.webp 2272w" sizes="(min-width: 1000px) 360px, 94vw" width="1136" height="682" loading="lazy" alt="A stacked column PivotChart of sales by year and category"></a>
        <h3>Forms, reports and pivots</h3>
        <p>Data entry forms with subforms, printed reports with totals, PivotTables, PivotCharts and nine chart types, all on the same records. No code, macros, or VBA: your choice.</p>
        <p class="more"><a href="/features/">All the features</a></p>
      </article>
      <article class="proof-card">
        <a href="/img/runtime-view-full@2x.webp" target="_blank" rel="noopener"><img src="/img/runtime-view.webp" srcset="/img/runtime-view.webp 1440w, /img/runtime-view@2x.webp 2880w" sizes="(min-width: 1000px) 360px, 94vw" width="1440" height="900" loading="lazy" alt="A User's view of an order form filling the window, with no design tools"></a>
        <h3>Shared as your own app</h3>
        <p>Invite your team by email. They open a link and get your forms, worksheets and reports, with no design tools, nothing to install and no licence of their own.</p>
        <p class="more"><a href="/features/#runtime">How sharing works</a></p>
      </article>
    </div>
  </div>
</section>

<!-- ============ Where workbooks and Access run out ============ -->
<section class="web limits" id="why" aria-labelledby="limits-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="limits-title">Where the workbook and the desktop database run out</h2>
      <p>Most shared workbooks start small and end up running something that matters. A 2024 review of the research found errors in 94% of the spreadsheets businesses use to make decisions ({ext(PHYS, 'reported by Phys.org')}).</p>
    </div>
    <div class="limits-grid">
      <article class="limit-card">
        <h3>A workbook used as a database</h3>
        <dl>
          <div><dt>Everyone ends up working on their own copy</dt><dd>One database, opened from a link. A changed cell saves its record straight away.</dd></div>
          <div><dt>Anything can be typed in any cell, and text and numbers mix in one column</dt><dd>Field types, required fields and validation rules, kept by the database under the sheet.</dd></div>
          <div><dt>No real relationships: lookups that break when a row moves</dt><dd>Related tables with referential integrity, and queries that join them.</dd></div>
          <div><dt>Whoever can open the file can change everything in it</dt><dd>Admins design, Users work with the data, and Guests only read it.</dd></div>
          <div><dt>VBA macros don't run in Excel for the web ({ext(MS_SCRIPTS, 'Microsoft')})</dt><dd>VBA that runs in the browser, with worksheet change events.</dd></div>
        </dl>
        <p class="more"><a href="/excel/">What carries over from Excel, and what's different</a></p>
      </article>
      <article class="limit-card">
        <h3>Access on the desktop</h3>
        <dl>
          <div><dt>PivotTables and PivotCharts were removed in Access 2013 ({ext(MS_PIVOT, 'Microsoft')})</dt><dd>Both are back, as views of any form, with drag and drop fields.</dd></div>
          <div><dt>Access web apps were shut down in 2018 ({ext(MS_WEBAPPS, 'Microsoft')})</dt><dd>Everything runs in a web browser, on Windows or a Mac.</dd></div>
          <div><dt>Everyone needs Access, or its runtime, installed</dt><dd>Nothing to install. People open a link.</dd></div>
          <div><dt>A file on a shared drive, split into a front end and a back end</dt><dd>Hosted for you, with sign-in, roles and nightly backups.</dd></div>
          <div><dt>VBA that stops at the desktop</dt><dd>VBA with the Access object model, in the browser, with a debugger.</dd></div>
        </dl>
        <p class="more"><a href="/access/">What you'll recognise from Access, and what changes</a></p>
      </article>
    </div>
  </div>
</section>

<!-- ============ Video ============ -->
<section class="tour" id="tour" hidden aria-labelledby="tour-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="tour-title">Watch it in use</h2>
      <p>Under two minutes, with narration and captions: a cell changed in a workbook and its record saved, a form running its VBA, a PivotTable and a PivotChart, the debugger stopping at a breakpoint, then a database shared and opened by a User.</p>
    </div>
    <div class="tour-frame"></div>
  </div>
</section>

<!-- ============ Visual Basic ============ -->
<section class="feature" id="vba" aria-labelledby="vba-title">
  <div class="wrap feature-grid">
    <div class="feature-text">
      <h2 id="vba-title">Visual Basic, in a web browser</h2>
      <p>Draw a form, drop controls on it, double-click a button and write its Click event. The language is VBA, the objects are the ones you know, and it runs in the browser with nothing installed.</p>
      <ul class="ticks">
        <li>Forms with text boxes, combo boxes, list boxes, tabs, subforms, charts, Tree View and List View, and their events</li>
        <li>A code window with IntelliSense, breakpoints, stepping, Locals, Watches and the Immediate window</li>
        <li>Class modules, <code>DoCmd</code>, DAO recordsets and domain functions such as <code>DLookup</code></li>
        <li>Excel's <code>Worksheet</code>, <code>Range</code> and <code>ListObject</code> for the workbook on a form</li>
      </ul>
      <p class="more"><a href="/vba/">Visual Basic in the browser: what runs, and what's different</a></p>
    </div>
    <figure class="shot">
      <div class="frame">
        <a href="/img/debugger-full@2x.webp" target="_blank" rel="noopener"><img src="/img/debugger.webp" srcset="/img/debugger.webp 1136w, /img/debugger@2x.webp 2272w" sizes="(min-width: 1100px) 760px, 94vw" width="1136" height="682" loading="lazy" alt="VBA paused at a breakpoint in a loop, with the current line highlighted and Locals listing a recordset and a string"></a>
      </div>
    </figure>
  </div>
</section>

<!-- ============ The assistant ============ -->
<section class="feature feature-alt" id="assistant" aria-labelledby="assistant-title">
  <div class="wrap feature-grid">
    <div class="feature-text">
      <h2 id="assistant-title">An assistant that builds it with you</h2>
      <p>Say what you need in plain words. The assistant looks at what's in your database, shows you a plan, and builds it only when you say go ahead.</p>
      <ul class="ticks">
        <li>Nothing changes until you approve its plan, and its last build can be undone</li>
        <li>It's sent the design of your database, not the records</li>
        <li>Everything it makes opens in the same designers you'd use</li>
      </ul>
      <p class="feature-note">The assistant is new, and it's an AI: it can be wrong, so look over what it makes. <a href="/features/#assistant">More about the assistant</a></p>
    </div>
    <figure class="shot">
      <div class="frame">
        <a href="/img/assistant-full@2x.webp" target="_blank" rel="noopener"><img src="/img/assistant.webp" srcset="/img/assistant.webp 1136w, /img/assistant@2x.webp 2272w" sizes="(min-width: 1100px) 760px, 94vw" width="1136" height="682" loading="lazy" alt="The Assistant: a request in plain words to keep track of supplier deliveries, and its plan of a table, a relationship, a query, a form, a report and a menu button, waiting for Go ahead"></a>
      </div>
      <figcaption>A plan, waiting for Go ahead. This picture was made with a scripted stand-in for the AI, to show the steps.</figcaption>
    </figure>
  </div>
</section>

<!-- ============ Plans ============ -->
{PLANS}
<!-- ============ Who is behind it ============ -->
<section class="why" id="about" aria-labelledby="why-title">
  <div class="wrap why-grid">
    <h2 id="why-title">Why I built it</h2>
    <div class="why-body">
      <figure class="why-quote">
        <blockquote class="bubble">
          <p>I've built in Excel and Access since their earliest versions. I've watched shared workbooks grow until nobody knew which copy was right. I've built on Access features, only to see them withdrawn. And we've all been told that VBA on the web isn't possible.</p>
          <p>So this is the tool I wanted: a spreadsheet and a database in one place, with forms, reports, pivots and VBA, running in a browser. I hope it's useful to you.</p>
        </blockquote>
        <figcaption class="why-sign"><img src="/img/brand/logo-mark.svg" alt="" width="34" height="34">Simon Wilson</figcaption>
      </figure>
      <ul class="trust">
        <li><strong>Your data stays yours.</strong> Download a complete copy of a database at any time.</li>
        <li><strong>Hosted in London</strong>, with every database in a file of its own.</li>
        <li><strong>Independent.</strong> Not made by or connected with Microsoft.</li>
        <li><strong>A person to ask.</strong> <a href="/pricing/#contact">Get in touch</a> and you'll get a reply from the person who built it.</li>
      </ul>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="faq" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <h2 id="faq-title">Questions</h2>
    <div class="faq-list">
      <details>
        <summary>What does the free plan include?</summary>
        <p>One database of your own, up to 5,000 records and 10 MB, with every design tool: worksheets, tables, queries, forms, reports, macros and VBA. You also get the Fieldfare Traders sample to take apart. You sign in from one place at a time. Sharing a database with other people needs the Builder plan; Preview as User shows what they'd see.</p>
      </details>
      <details>
        <summary>What do I pay for?</summary>
        <p>Sharing. The Builder plan is £15 a month or £99 a year for each Admin, the people who design. Up to 10 people then use each database free, as Users or Guests. <a href="/pricing/">Pricing</a> has the detail.</p>
      </details>
      <details>
        <summary>Is it Excel?</summary>
        <p>No. Web Access Builder is an independent product, and isn't made by or connected with Microsoft. Its workbook has several sheets, formulas and formatting, and it reads and writes Excel files, but it doesn't do everything Excel does. <a href="/excel/">Coming from Excel</a> says what carries over and what doesn't.</p>
      </details>
      <details>
        <summary>Is this Microsoft Access?</summary>
        <p>No. It's an independent product that works the way Access does, in a browser, without Access installed. <a href="/access/">Coming from Access</a> has the detail.</p>
      </details>
      <details>
        <summary>Can I bring my workbook or my Access database?</summary>
        <p>Yes, as a starting point. A workbook imports with its values, formulas and formatting, and its data imports into tables. An Access database imports its tables, queries, forms, reports and code. Neither comes across perfectly: the <a href="/excel/">Excel</a> and <a href="/access/">Access</a> pages say what to expect.</p>
      </details>
      <details>
        <summary>What happens to my data if I stop using it?</summary>
        <p>You can download a complete copy of a database at any time. A free account that isn't used for 180 days is deleted.</p>
      </details>
      <details>
        <summary>What does the AI assistant see?</summary>
        <p>The design of your database: its tables' fields, queries, forms, reports, macros and code. Not the records. If it would help to see a few rows of a table, it asks first, each time, and shows up to five if you allow it. It runs on Anthropic's Claude, only for Admins. Nothing it plans is built until you approve it.</p>
      </details>
      <details>
        <summary>Is there a demo?</summary>
        <p>Yes: <a href="{DEMO}" rel="noopener" target="_blank" data-hit="demo">demo.webaccessbuilder.com</a>. One click gives you your own copy of the Fieldfare Traders sample with full design rights and no sign-up. It isn't kept: start a free account to keep what you build.</p>
      </details>
    </div>
  </div>
</section>
''' + cta('Build your first database today', 'Free, with no card. Start from a workbook, an Access database, or nothing at all.') + FOOTER
open('public/index.html', 'w').write(home_html)

# =============================================================== /features/
feat = ''.join(home[k] for k in ['Spreadsheets', 'Tables and queries', 'Forms', 'Reports', 'Pivot', 'Code', 'The assistant', 'Runtime: simple to build, free to hand out', 'Everything in one place', 'Roadmap', 'Suggest a feature'])
feat = fix_links(feat)
def sub(old, new, count=1):
    global feat
    assert feat.count(old) == count, (feat.count(old), old[:60])
    feat = feat.replace(old, new)
sub('<p class="runtime-status">Sharing, the runtime and the error log are in the app now. While we test, we set up each account ourselves: <a href="/pricing/#contact">request a test instance</a> to try them. Paying isn\'t switched on yet.</p>',
    '<p class="runtime-status">Sharing a database needs the <a href="/pricing/">Builder plan</a>. On the free plan, Preview as User shows exactly what your team would get.</p>')
sub('      <li><strong>Paying online</strong>, when testing is over</li>\n', '')
sub('<p class="feature-note">The assistant is new, and it\'s an AI: it can be wrong, so look over what it makes. It isn\'t in the public demo yet. <a href="/pricing/#contact">Request a test instance</a> to try it.</p>',
    '<p class="feature-note">The assistant is new, and it\'s an AI: it can be wrong, so look over what it makes. It isn\'t in the public demo; a free account has a small monthly allowance for it.</p>')
sub('<p>Something you rely on in Excel or Access that isn\'t here yet? Something neither ever had that you\'ve always wanted? Tell us.</p>', '<p>Something you rely on in Excel or Access that isn\'t here yet? Something neither ever had that you\'ve always wanted? Tell us.</p>')
features_html = head(
  'Features: worksheets, forms, reports, PivotTables and VBA | Web Access Builder',
  'Everything in Web Access Builder: worksheets on live data, tables and queries, forms, reports, PivotTables, PivotCharts, charts, macros, VBA with a debugger, an AI assistant, and sharing in a runtime.',
  '/features/') + header('/features/') + f'''
<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">Features</h1>
    <p class="lede">A spreadsheet, a database, a form and report designer and a VBA editor, in one place, in a browser. This page has all of it, with screenshots of each part.</p>
    <p class="hero-actions">
      {START}
      {TRY}
    </p>
    <p class="jump"><a href="#sheets">Worksheets</a> <a href="#data">Tables and queries</a> <a href="#forms">Forms</a> <a href="#reports">Reports</a> <a href="#pivot">Pivots</a> <a href="#code">Code</a> <a href="#assistant">Assistant</a> <a href="#runtime">Sharing</a></p>
  </div>
</section>

''' + feat + cta('Try all of it, free', 'One database of your own, every design tool, and the sample to take apart.') + FOOTER
import os
os.makedirs('public/features', exist_ok=True)
open('public/features/index.html', 'w').write(features_html)

# =============================================================== /vba/
code = fix_links(home['Code'])
vba_html = head(
  'Visual Basic in a web browser: VBA forms, events and a debugger | Web Access Builder',
  'Write VBA in a web browser. Forms with controls and events, class modules, DAO and DoCmd, with IntelliSense, breakpoints and Locals. Nothing to install, and free to start.',
  '/vba/') + header('/vba/') + f'''
<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">Visual Basic, in a web browser</h1>
    <p class="lede">If you learned to build software by drawing a form, dropping a button on it and writing its Click event, this will feel like home. The language is VBA, the forms and controls are the ones you know, and the result is a web application your team opens from a link.</p>
    <p class="hero-actions">
      {START}
      {TRY}
    </p>
  </div>
</section>

<section class="familiar" id="why-vba" aria-labelledby="why-vba-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="why-vba-title">VBA never made it to the web. Until now.</h2>
      <p>Millions of people know VBA, and what they've built with it is stuck on the desktop.</p>
    </div>
    <div class="datasheet-scroll" tabindex="0" role="region" aria-label="Where VBA stops, and what Web Access Builder does">
      <table class="datasheet stack">
        <thead>
          <tr><th class="sel" aria-hidden="true"></th><th scope="col">Where VBA stops</th><th scope="col">In Web Access Builder</th></tr>
        </thead>
        <tbody>
          <tr><td class="sel" aria-hidden="true"></td><td>VBA macros don't run in Excel for the web. Its scripts are written in TypeScript instead ({ext(MS_SCRIPTS, 'Microsoft')})</td><td>VBA runs in the browser, on an interpreter written for it. Nothing is installed</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Access has no web version: its web apps were shut down in 2018 ({ext(MS_WEBAPPS, 'Microsoft')})</td><td>Forms, reports and their code open from a link, on Windows or a Mac</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Microsoft has said VBA will stay but won't be developed further ({ext(NLS, 'reported by No Longer Set')})</td><td>The language you know, with additions: JavaScript modules your VBA can call, and an AI assistant that writes code and explains errors</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Moving to the web usually means a new language, a framework, a server and a database</td><td>One tool. Draw the form, write the event, share the link</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="feature feature-alt" id="forms" aria-labelledby="vbforms-title">
  <div class="wrap feature-grid">
    <div class="feature-text">
      <h2 id="vbforms-title">Forms, controls and events</h2>
      <p>Design view works the way you expect: a grid, a toolbox, a property sheet and a field list. Every control has events, and the code behind them is a module of the form.</p>
      <ul class="ticks">
        <li>Text boxes, combo boxes, list boxes, check boxes, option groups, buttons, tabs, subforms and images</li>
        <li>Tree View, List View, Image List, Progress Bar, Slider and UpDown, built in, working the way the Windows Common Controls do</li>
        <li>Chart controls, a Spreadsheet control and a Web Browser control</li>
        <li>Form and control events: Load, Current, BeforeUpdate, AfterUpdate, Click, Change, Timer and the rest</li>
        <li><code>Me</code>, <code>Forms!</code>, <code>Screen.ActiveForm</code>, <code>OpenArgs</code> and <code>TempVars</code></li>
      </ul>
      <p class="more"><a href="/features/#forms">More about forms</a></p>
    </div>
    <figure class="shot" data-views>
      <div class="viewbar" role="tablist" aria-label="Form screens">
        <button role="tab" type="button" aria-selected="true" data-img="form-design" data-alt="Form Design view with the controls on the command bar, the field list and the property sheet">Design view</button>
        <button role="tab" type="button" aria-selected="false" data-img="form-code" data-alt="The module behind a form: a Click event that builds a filter and applies it to a subform">Its code</button>
        <button role="tab" type="button" aria-selected="false" data-img="treeview-listview" data-alt="A form with a Tree View of categories and their products, filled by VBA, and the chosen product's details beside it">Tree View</button>
        <button role="tab" type="button" aria-selected="false" data-img="form-view" data-alt="A single form for one order, with its order lines in a subform and the order's total worked out underneath">Running</button>
      </div>
      <div class="frame" role="tabpanel">
        <img src="/img/form-design.webp" srcset="/img/form-design.webp 1136w, /img/form-design@2x.webp 2272w" sizes="(min-width: 1100px) 760px, 94vw" width="1136" height="682" loading="lazy" alt="Form Design view with the controls on the command bar, the field list and the property sheet">
      </div>
    </figure>
  </div>
</section>

''' + code.replace('id="code"', 'id="code"') + f'''
<section class="web" id="different" aria-labelledby="different-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="different-title">What's different in a browser</h2>
      <p>It's VBA, but it isn't Windows. These are the things to know before you bring code across.</p>
    </div>
    <dl class="extras extras-wide">
      <div><dt>No Windows API</dt><dd><code>Declare</code> statements and <code>CreateObject</code> for desktop applications have nothing to call in a browser. <code>Dictionary</code> and <code>RegExp</code> are built in.</dd></div>
      <div><dt>Files are the browser's</dt><dd>Code can't read or write the disk directly. Imports and exports go through the browser's file picker and downloads.</dd></div>
      <div><dt>Not Excel's whole object model</dt><dd>Workbook, Worksheet, Range and ListObject are there for the Spreadsheet control. Charts, shapes and other Office applications are not.</dd></div>
      <div><dt>JavaScript when you want it</dt><dd>Where desktop code would call a DLL, write a JavaScript module and call its functions from VBA.</dd></div>
    </dl>
    <p class="web-more"><a href="/guides/programmers-guide/">The Programmer's Guide</a> lists what's supported, statement by statement, and <a href="/guides/access-differences/">Differences from Access</a> lists what isn't.</p>
  </div>
</section>
''' + cta('Write your first event in the browser', 'Free, with no card. The sample database comes with working code to step through.') + FOOTER
import os
os.makedirs('public/vba', exist_ok=True)
open('public/vba/index.html', 'w').write(vba_html)

# =============================================================== /pricing/
pricing_html = head(
  'Pricing: free to build, £15 a month to share | Web Access Builder',
  'Web Access Builder is free to build with: one database and every design tool. The Builder plan, £15 a month for each Admin, shares each database with up to 10 people at no cost to them.',
  '/pricing/') + header('/pricing/') + f'''
<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">Pricing</h1>
    <p class="lede">Build for nothing. Pay when it's ready to share. The people you share it with never pay.</p>
  </div>
</section>

{PLANS.replace('<p class="plan-cta"><a class="btn btn-ghost" href="/pricing/">Compare the plans</a></p>', '<p class="plan-cta"><a class="btn btn-ghost" href="#compare">Compare the plans</a></p>')}
<section class="familiar" id="compare" aria-labelledby="compare-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="compare-title">The plans, side by side</h2>
    </div>
    <div class="datasheet-scroll" tabindex="0" role="region" aria-label="The Free and Builder plans compared">
      <table class="datasheet">
        <thead>
          <tr><th class="sel" aria-hidden="true"></th><th scope="col">&nbsp;</th><th scope="col">Free</th><th scope="col">Builder</th></tr>
        </thead>
        <tbody>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Price</th><td>£0</td><td>£15 a month or £99 a year, for each Admin</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Databases of your own</th><td>1, plus the sample</td><td>As many as you need</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Size of a database</th><td>5,000 records and 10 MB</td><td>No plan limit</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Tables, queries, forms, reports and code</th><td>No limit</td><td>No limit</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Worksheets, PivotTables, charts, macros and VBA</th><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Import and export: Excel, Access and CSV</th><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Preview as User</th><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td><td><span class="yn yes"><span class="visually-hidden">Yes</span></span></td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Share a database with Users and Guests</th><td><span class="yn"><span class="visually-hidden">No</span></span></td><td>Up to 10 people for each database, free for them</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Signed in at once</th><td>One place at a time</td><td>As you need</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">AI assistant</th><td>A small monthly allowance</td><td>A larger monthly allowance</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Backups</th><td>Download a copy at any time</td><td>Nightly backups, and a download at any time</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><th scope="row">Kept for</th><td>Deleted after 180 days without use</td><td>As long as you subscribe</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="faq" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <h2 id="faq-title">Questions about the plans</h2>
    <div class="faq-list">
      <details>
        <summary>Is the free plan a trial?</summary>
        <p>No. It doesn't run out. It's for building and testing on your own: one database, up to 5,000 records and 10 MB, with every design tool. A free account that isn't used for 180 days is deleted.</p>
      </details>
      <details>
        <summary>Who needs a paid seat?</summary>
        <p>Admins: the people who design tables, forms, reports and code. The people you share a database with, Users who work with the data and Guests who only read it, don't pay and don't need a licence of their own.</p>
      </details>
      <details>
        <summary>What counts towards the 5,000 records and 10 MB?</summary>
        <p>The records in all the tables of your database together, and its size including attachments. The sample database doesn't count.</p>
      </details>
      <details>
        <summary>Why can't I share on the free plan?</summary>
        <p>Sharing is what the subscription pays for. Preview as User opens your database exactly as your team would see it, so you can finish and test everything before you subscribe.</p>
      </details>
      <details>
        <summary>What if more than 10 people need one database?</summary>
        <p>A database can move to a hosted SQL database for more people, at a fee that covers its hosting. <a href="#contact">Get in touch</a> and tell us how many.</p>
      </details>
      <details>
        <summary>Can I take my data away?</summary>
        <p>Yes, on either plan. Back Up Database downloads a complete copy, and any table exports to Excel or CSV.</p>
      </details>
    </div>
  </div>
</section>

<section class="request" id="contact" aria-labelledby="contact-title">
  <div class="wrap request-grid">
    <div class="request-intro">
      <h2 id="contact-title">Get in touch</h2>
      <p>A question before you start, more than 10 people on one database, or something that doesn't fit the plans: write here and you'll get a reply by email from the person who built it.</p>
    </div>
    <form class="accform" id="request-form" action="/api/request" method="post" novalidate>
      <div class="accform-section">Form Header</div>
      <div class="accform-header">
        <span class="accform-title">Send us a message</span>
      </div>
      <div class="accform-section">Detail</div>
      <div class="accform-detail">
        <div class="field">
          <label for="f-name">Your name</label>
          <input id="f-name" name="name" type="text" autocomplete="name" required maxlength="100">
        </div>
        <div class="field">
          <label for="f-email">Email</label>
          <input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200">
        </div>
        <div class="field field-wide">
          <label for="f-msg">Your message</label>
          <textarea id="f-msg" name="message" rows="5" maxlength="4000"></textarea>
        </div>
        <div class="field hp" aria-hidden="true">
          <label for="f-web">Leave this empty</label>
          <input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
      </div>
      <div class="accform-section">Form Footer</div>
      <div class="accform-footer">
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
        <button class="btn btn-primary" type="submit">Send message</button>
      </div>
    </form>
  </div>
</section>
''' + FOOTER
os.makedirs('public/pricing', exist_ok=True)
open('public/pricing/index.html', 'w').write(pricing_html)

# =============================================================== /excel/ and /access/
def rebuild(page, path, title, desc, pagehead, extra_top, closing):
    a = page.index('<section class="pagehead"'); b = page.index('</section>', a) + len('</section>\n')
    end = page.index('\n</main>')
    body = fix_links(page[b:end])
    return head(title, desc, path) + header(path) + pagehead + extra_top + body + closing + FOOTER

why_not = home['When the spreadsheet is the system'].replace('id="why-not"', 'id="limits"')
excel_html = rebuild(excel, '/excel/',
  'An Excel alternative for shared data: a spreadsheet with a database behind it | Web Access Builder',
  'Using an Excel workbook as a database? Keep your worksheets, formulas and VBA, on a real database that everyone shares, in a browser. What carries over from Excel, what is different, and how to start.',
  f'''
<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">Coming from Excel</h1>
    <p class="lede">If your team runs on a shared workbook, you already know where it hurts: copies, overwritten formulas, and macros that won't run online. Here you keep your worksheets, formulas and VBA, on a database that everyone shares.</p>
    <p class="hero-actions">
      {START}
      {TRY}
    </p>
  </div>
</section>

''', why_not + '\n', cta('Start from the workbook you already have', 'Free, with no card. Import it, bind a sheet to a table, and see your formulas on live records.'))
open('public/excel/index.html', 'w').write(excel_html)

lost = f'''<section class="web" id="lost" aria-labelledby="lost-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="lost-title">What Access lost, and never had</h2>
      <p>Access is still the quickest way to build a database application. These are the places it stopped, with what you get here.</p>
    </div>
    <div class="datasheet-scroll" tabindex="0" role="region" aria-label="Where Access stops, and what Web Access Builder does">
      <table class="datasheet datasheet-dark stack">
        <thead>
          <tr><th class="sel" aria-hidden="true"></th><th scope="col">In Access</th><th scope="col">In Web Access Builder</th></tr>
        </thead>
        <tbody>
          <tr><td class="sel" aria-hidden="true"></td><td>PivotTable and PivotChart views were removed in Access 2013 ({ext(MS_PIVOT, 'Microsoft')})</td><td>Both are back as views of any form: drag fields to rows, columns and totals, and group dates by year, quarter or month</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Analysis means exporting to Excel</td><td>PivotTables, PivotCharts and a Spreadsheet control with formulas, on the live records</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Access web apps were shut down in 2018 ({ext(MS_WEBAPPS, 'Microsoft')})</td><td>Everything runs in a web browser, on Windows or a Mac</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Everyone needs Access, or its runtime, installed</td><td>Nothing to install. Share a link; up to 10 people use each database free</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>A front end to hand out again after every change</td><td>Save a change and everyone has it the next time they open the form</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>A back end on a shared drive</td><td>Hosted for you in London, with sign-in, roles and nightly backups</td></tr>
          <tr><td class="sel" aria-hidden="true"></td><td>Charts in a handful of types</td><td>Column, bar, line, area, combo, pie, doughnut, scatter and bubble, in 27 palettes, formatted from code</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

'''
access_html = rebuild(access, '/access/',
  'An Access alternative on the web, with PivotTables, PivotCharts and VBA | Web Access Builder',
  'Built for people who know Microsoft Access: tables, queries, forms, reports, macros and VBA in a web browser, with PivotTable and PivotChart views back, and an import for your .accdb.',
  f'''
<section class="pagehead" aria-labelledby="page-title">
  <div class="wrap">
    <h1 id="page-title">Coming from Access</h1>
    <p class="lede">Web Access Builder is an independent product, built for people who know Microsoft Access. Tables, queries, forms, reports, macros and VBA, in a browser, with nothing to install, and with the PivotTable and PivotChart views that Access dropped.</p>
    <p class="hero-actions">
      {START}
      {TRY}
    </p>
  </div>
</section>

''', lost, cta('Bring a database across and see', 'Free, with no card. Import an .accdb and open its forms, reports and code in the browser.'))
open('public/access/index.html', 'w').write(access_html)

# =============================================================== screenshots page and the guides' template
def reshell(html, current):
    a = html.index('\n<header class="titlebar">'); m = html.index('<main id="main"'); b = html.index('>', m) + 2
    c = html.index('\n</main>')
    return html[:a] + header(current).replace('<main id="main">', html[m:b - 1]) + fix_links(html[b:c]) + FOOTER
shots = main_file('public/screenshots/index.html')
open('public/screenshots/index.html', 'w').write(reshell(shots, ''))
print('pages written')
