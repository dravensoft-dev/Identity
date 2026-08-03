/* The boundary wrap of a trap is Arena's own .focus() call and happy-dom honours it. The INTERIOR
 * is native sequential focus navigation, which happy-dom does not have -- a suite asserting it
 * there passes identically against a perfect trap and against none, which is why the record said
 * a person had to check it. check:cards already drives real Chromium over CDP, and the same
 * connection presses a real Tab. TRAPS names a page per layer that binds dialog-modal, because
 * the contract is the authority and each layer answers it separately. Each page opens its panel
 * from its own fixture, so no button has to be found by its text: a demo page whose copy moved
 * used to walk a page with nothing open and report a trap that holds. FOCUSABLE repeats :not([tabindex="-1"]) on every clause because a selector list
 * is OR'd -- writing it loose once made this gate call a correct combobox a broken trap, which
 * is the same hazard the trap's own selector carries a note about. */

import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../../lib/arena/static-server.mjs';
import { findChromium, launchChromium } from '../../lib/arena/chromium.mjs';
import { connect } from '../../lib/arena/cdp.mjs';
import { skipExitCode } from '../../lib/arena/arena-scripts-vars.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

const NAVIGATE_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_100;
const STEP_MS = 60;

const REACHABLE = ':not([tabindex="-1"])';
export const FOCUSABLE = [
  `a[href]${REACHABLE}`,
  `button:not([disabled])${REACHABLE}`,
  `input:not([disabled])${REACHABLE}`,
  `select:not([disabled])${REACHABLE}`,
  `textarea:not([disabled])${REACHABLE}`,
  `[tabindex]${REACHABLE}`,
].join(', ');

export const PANEL = '[role="dialog"], [role="alertdialog"]';

export const TRAPS = [
  { name: 'ConfirmDialog:react', page: 'frameworks/react/components/feedback/confirm-dialog/ConfirmDialog.demo.generated.html' },
  { name: 'Onboarding:react', page: 'frameworks/react/components/feedback/onboarding/Onboarding.demo.generated.html' },
  { name: 'CommandPalette:react', page: 'frameworks/react/components/navigation/command-palette/CommandPalette.demo.generated.html' },
  { name: 'ConfirmDialog:angular', page: 'frameworks/angular/components/feedback/confirm-dialog/ConfirmDialog.demo.generated.html' },
  { name: 'Dialog:angular', page: 'frameworks/angular/components/feedback/dialog/Dialog.demo.generated.html' },
  { name: 'CommandPalette:angular', page: 'frameworks/angular/components/navigation/command-palette/CommandPalette.demo.generated.html' },
];

export function walkProblems(name, walk) {
  const problems = [];
  if (!walk.panel) return [`${name}: no ${PANEL} rendered, so nothing was walked`];
  if (walk.focusables === 0) {
    return [`${name}: the panel holds no Tab stop at all, so a keyboard user who reaches it cannot act`];
  }
  if (!walk.startsInside) problems.push(`${name}: focus did not start inside the panel, so the trap never claimed it`);

  const escaped = walk.forward.filter((s) => !s.inside);
  if (escaped.length) {
    problems.push(`${name}: focus left the panel on Tab ${escaped.map((s) => s.press).join(', ')} -- the interior is not trapped`);
  }
  if (walk.visited < walk.focusables) {
    problems.push(
      `${name}: ${walk.focusables} focusable element(s) in the panel and Tab reached ${walk.visited} -- `
      + 'a trap that clamps on one control is not the same as one a user can move through',
    );
  }
  if (walk.focusables === 1) return problems;
  if (!walk.wrapsForward) problems.push(`${name}: Tab from the last focusable did not return to the first`);
  if (!walk.wrapsBackward) problems.push(`${name}: Shift+Tab from the first focusable did not reach the last`);
  return problems;
}

function withTimeout(promise, ms, message) {
  let timer;
  const bound = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

async function walkTrap(cdp, url) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  try {
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 760, deviceScaleFactor: 1, mobile: false }, sessionId);
    await withTimeout(cdp.send('Page.navigate', { url }, sessionId), NAVIGATE_TIMEOUT_MS, `${url}: navigate timed out`);

    const ev = (expression) => cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    const tab = async (shift) => {
      const modifiers = shift ? 8 : 0;
      for (const type of ['rawKeyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab', modifiers }, sessionId);
      }
      await ev(`new Promise((r) => setTimeout(r, ${STEP_MS}))`);
    };

    await ev(`new Promise((r) => setTimeout(r, ${SETTLE_MS}))`);

    const seen = (await ev(`(() => {
      const panel = document.querySelector(${JSON.stringify(PANEL)});
      if (!panel) return { panel: false, focusables: 0, startsInside: false };
      const list = [...panel.querySelectorAll(${JSON.stringify(FOCUSABLE)})];
      list.forEach((el, i) => { el.dataset.arenaTrapIndex = String(i); });
      return { panel: true, focusables: list.length, startsInside: panel.contains(document.activeElement) };
    })()`)).result.value;
    if (!seen.panel || seen.focusables === 0) return { ...seen, forward: [], visited: 0, wrapsForward: false, wrapsBackward: false };

    const reached = new Set();
    const forward = [];
    for (let press = 1; press <= seen.focusables + 1; press += 1) {
      await tab(false);
      const step = (await ev(`(() => {
        const panel = document.querySelector(${JSON.stringify(PANEL)});
        const active = document.activeElement;
        return { inside: panel.contains(active), index: active?.dataset?.arenaTrapIndex ?? null };
      })()`)).result.value;
      forward.push({ press, inside: step.inside });
      if (step.index !== null) reached.add(step.index);
    }
    const afterLoop = (await ev(`document.activeElement?.dataset?.arenaTrapIndex ?? null`)).result.value;

    await ev(`(() => {
      const panel = document.querySelector(${JSON.stringify(PANEL)});
      panel.querySelector('[data-arena-trap-index="0"]').focus();
      return true;
    })()`);
    await tab(true);
    const back = (await ev(`document.activeElement?.dataset?.arenaTrapIndex ?? null`)).result.value;

    return {
      ...seen,
      forward,
      visited: reached.size,
      wrapsForward: afterLoop === '0' || reached.size === seen.focusables,
      wrapsBackward: back === String(seen.focusables - 1),
    };
  } finally {
    try { await cdp.send('Target.closeTarget', { targetId }); } catch { void 0; }
  }
}

function skip(reason) {
  const code = skipExitCode();
  console.error(`check-focus-trap: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  process.exit(code);
}

async function main() {
  if (TRAPS.length === 0) skip('TRAPS is empty -- a walk with nothing to walk proves nothing');
  const browser = findChromium();
  if (!browser.path) skip(browser.reason);

  const server = await startStaticServer(root);
  const chrome = await launchChromium(browser.path);
  const cdp = await connect(chrome.wsUrl);
  const problems = [];
  try {
    for (const trap of TRAPS) {
      const walk = await walkTrap(cdp, `http://127.0.0.1:${server.port}/${trap.page}`);
      problems.push(...walkProblems(trap.name, walk));
    }
  } finally {
    chrome.kill?.();
    server.close?.();
  }

  if (problems.length) {
    console.error(`check-focus-trap: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-focus-trap: ${TRAPS.length} trap(s) walked with real Tab presses — focus stayed inside, reached every control and wrapped both ways`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
