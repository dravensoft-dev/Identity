/* The repository root, derived once. Every script that needs it imports it from
 * here rather than counting '..' segments from its own location, so a script's
 * depth under scripts/ is not part of what it has to get right. This file is the
 * one place that counts, and it is why moving THIS file needs care. */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const repoRoot: string = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
