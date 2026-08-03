/* The density control, the sibling of theme.js and read by the same toggle.css.
 *
 * It lives here rather than inline in the Overview because the playground pages
 * need it too, and a second copy is how the two drift apart. The state it flips
 * is a class on the root element, so nothing that consumes it has to know this
 * file exists.
 *
 * A page with no #density button is left alone entirely: the class is a control's
 * state, and a page with no control has no state to restore. Applying it would
 * silently re-densify a page nobody asked to.
 *
 * Consumers are notified by an arena:density event rather than by listening to
 * the button, because a module script registers its listener before this classic
 * script does and would otherwise read the state it is about to be told changed.
 */
(function () {
  var KEY = 'draven-density';

  function apply(compact) {
    document.documentElement.classList.toggle('arena-compact', compact);
    var b = document.getElementById('density');
    if (b) {
      b.setAttribute('data-compact', compact ? '1' : '0');
      var l = b.querySelector('.tlabel');
      if (l) l.textContent = compact ? 'Compact' : 'Comfortable';
    }
    document.dispatchEvent(new CustomEvent('arena:density', { detail: { compact: compact } }));
  }

  function remember(compact) {
    var value = compact ? 'compact' : 'comfortable';
    try { localStorage.setItem(KEY, value); } catch (_) {}
    var url = new URL(window.location.href);
    url.searchParams.set('density', value);
    history.replaceState(null, '', url);
  }

  function toggle() {
    var compact = !document.documentElement.classList.contains('arena-compact');
    remember(compact);
    apply(compact);
  }

  window.__toggleDensity = toggle;

  function chosen() {
    var q = new URLSearchParams(window.location.search).get('density');
    if (q === 'compact' || q === 'comfortable') return q;
    try { return localStorage.getItem(KEY) || 'comfortable'; } catch (_) { return 'comfortable'; }
  }

  function start() {
    var btn = document.getElementById('density');
    if (!btn) return;
    btn.addEventListener('click', toggle);
    apply(chosen() === 'compact');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
