// Guides: on narrow screens the contents start folded; on wide ones the section you're reading is marked.
const nav = document.querySelector('.guide-nav');
if (nav && window.matchMedia('(max-width: 960px)').matches) nav.open = false;

const links = new Map([...document.querySelectorAll('.guide-toc a')].map((a) => [a.getAttribute('href').slice(1), a]));
const heads = [...document.querySelectorAll('.guide-body h2[id]')];
if (links.size && heads.length) {
  let current = null;
  let pinned = null; // a section just chosen from the contents stays marked while the page scrolls to it
  const mark = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((a, key) => a.classList.toggle('current', key === id));
  };
  const update = () => {
    if (pinned) return;
    // the last section heading whose top has passed the upper third of the window
    const line = Math.max(160, window.innerHeight * 0.33);
    let id = heads[0].id;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= line) id = h.id;
      else break;
    }
    // at the very bottom, the last section is the one being read
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = heads[heads.length - 1].id;
    mark(id);
  };
  links.forEach((a, id) => a.addEventListener('click', () => { mark(id); pinned = id; }));
  // the reader scrolling for themselves takes over from a clicked section
  const unpin = () => { if (pinned) { pinned = null; requestAnimationFrame(update); } };
  ['wheel', 'touchmove', 'mousedown'].forEach((ev) => window.addEventListener(ev, unpin, { passive: true }));
  window.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) unpin(); });
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }, { passive: true });
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (links.has(fromHash)) { mark(fromHash); pinned = fromHash; } else update();
}
