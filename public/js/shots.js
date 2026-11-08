// Screenshots page: clicking a screenshot opens it full size, with its caption,
// and the arrow keys (or the buttons) move through the rest. Esc or a click outside closes it.
const box = document.getElementById('lightbox');
const cards = [...document.querySelectorAll('.shotcard')];
if (box && cards.length && typeof box.showModal === 'function') {
  const img = document.getElementById('lb-img');
  const title = document.getElementById('lb-title');
  const text = document.getElementById('lb-text');
  let at = 0;

  const show = (i) => {
    at = (i + cards.length) % cards.length;
    const card = cards[at];
    const link = card.querySelector('.shotcard-img');
    const small = card.querySelector('img');
    img.src = small.currentSrc || small.src; // shows at once, then the sharp one replaces it
    img.alt = small.alt;
    const sharp = new Image();
    sharp.onload = () => { if (cards[at] === card) img.src = sharp.src; };
    sharp.src = link.dataset.full;
    title.textContent = card.querySelector('h3').textContent;
    text.textContent = card.querySelector('figcaption p').firstChild.textContent;
  };

  cards.forEach((card, i) => card.querySelector('.shotcard-img').addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // let new-tab clicks through
    e.preventDefault();
    show(i);
    box.showModal();
  }));
  document.getElementById('lb-prev').addEventListener('click', () => show(at - 1));
  document.getElementById('lb-next').addEventListener('click', () => show(at + 1));
  document.getElementById('lb-close').addEventListener('click', () => box.close());
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
  });
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('close', () => { img.removeAttribute('src'); cards[at].querySelector('.shotcard-img').focus(); });
}
