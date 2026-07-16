(function () {
  window.__themeLoaded = true;
  function apply(light) {
    document.documentElement.classList.toggle('arena-light', light);
    var b = document.querySelector('.themebtn');
    if (b) {
      b.setAttribute('data-light', light ? '1' : '0');
      var l = b.querySelector('.tlabel');
      if (l) l.textContent = light ? 'Claro' : 'Oscuro';
    }
  }
  function toggle() {
    var light = !document.documentElement.classList.contains('arena-light');
    try { localStorage.setItem('draven-theme', light ? 'light' : 'dark'); } catch (_) {}
    apply(light);
  }
  window.__toggleTheme = toggle;
  function init() {
    var btn = document.querySelector('.themebtn');
    if (!btn) return setTimeout(init, 60);
    btn.onclick = toggle;
    var t = 'dark';
    try { t = localStorage.getItem('draven-theme') || 'dark'; } catch (_) {}
    apply(t === 'light');
  }
  init();
})();
