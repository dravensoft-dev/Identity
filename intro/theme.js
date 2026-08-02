/* The theme control, read by the shared toggle.css.
 *
 * A theme= parameter in the query string wins over the stored choice on load,
 * and a toggle writes both. That is what makes a playground URL reproduce the
 * view it was copied from: without it the same link renders dark for one reader
 * and light for the next, and the comparison those pages exist for is lost.
 */
(function () {
  window.__themeLoaded = true;
  var KEY = 'draven-theme';

  function apply(light) {
    document.documentElement.classList.toggle('arena-light', light);
    var b = document.querySelector('.themebtn');
    if (b) {
      b.setAttribute('data-light', light ? '1' : '0');
      var l = b.querySelector('.tlabel');
      if (l) l.textContent = light ? 'Light' : 'Dark';
    }
  }

  function remember(light) {
    var value = light ? 'light' : 'dark';
    try { localStorage.setItem(KEY, value); } catch (_) {}
    var url = new URL(window.location.href);
    url.searchParams.set('theme', value);
    history.replaceState(null, '', url);
  }

  function toggle() {
    var light = !document.documentElement.classList.contains('arena-light');
    remember(light);
    apply(light);
  }

  window.__toggleTheme = toggle;

  function chosen() {
    var q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark') return q;
    try { return localStorage.getItem(KEY) || 'dark'; } catch (_) { return 'dark'; }
  }

  function init() {
    var btn = document.querySelector('.themebtn');
    if (!btn) return setTimeout(init, 60);
    btn.onclick = toggle;
    apply(chosen() === 'light');
  }

  init();
})();
