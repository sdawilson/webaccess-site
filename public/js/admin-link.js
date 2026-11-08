// Shows an "Admin" button in the title bar for whoever has signed in on /admin in this browser.
// It's only a shortcut: the admin page and its data still need the sign-in to work.
(() => {
  let ok = false;
  try {
    const t = JSON.parse(localStorage.getItem('wab-admin') || 'null');
    ok = !!(t && t.token && t.expires > Date.now());
  } catch { ok = false; }
  if (!ok) return;
  const bar = document.querySelector('.titlebar-inner');
  const tryIt = bar && bar.querySelector('.btn-light');
  if (!bar) return;
  const a = document.createElement('a');
  a.className = 'btn btn-admin';
  a.href = '/admin/';
  a.textContent = 'Admin';
  if (tryIt) bar.insertBefore(a, tryIt); else bar.append(a);
})();
