// Guides: on narrow screens the contents start folded; on wide ones the section you're reading is marked.
const nav = document.querySelector('.guide-nav');
if (nav && window.matchMedia('(max-width: 960px)').matches) nav.open = false;

const links = new Map([...document.querySelectorAll('.guide-toc a')].map((a) => [a.getAttribute('href').slice(1), a]));
const heads = [...document.querySelectorAll('.guide-body h2[id]')];
if (links.size && heads.length) {
  let current = null;
  let queued = false;
  const update = () => {
    queued = false;
    // the last section heading that has scrolled past the top of the window
    let id = heads[0].id;
    for (const h of heads) {
      if (h.getBoundingClientRect().top < 120) id = h.id;
      else break;
    }
    if (id === current) return;
    current = id;
    links.forEach((a, key) => a.classList.toggle('current', key === id));
  };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
