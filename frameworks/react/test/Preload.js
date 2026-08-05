/* The breakpoints are bridged from the generated token file rather than typed
 * here, so no value is duplicated. This flips nothing on its own: happy-dom has
 * a ResizeObserver that never fires, so useArenaContainerWidth's width stays null and
 * every responsive branch stays wide -- a suite wanting the narrow one stubs the
 * observer. Without this, readBreakpoint() reads '', returns NaN and warns, and
 * `width < NaN` is false, so every suite would assert around a wide-only tree. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const spacing = readFileSync(join(repo, 'contracts', 'design-generated', 'spacing.generated.css'), 'utf8');
for (const [, name, value] of spacing.matchAll(/(--bp-[a-z]+)\s*:\s*([^;]+);/g)) {
  document.documentElement.style.setProperty(name, value.trim());
}
