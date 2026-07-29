import * as React from 'react';
import type { LogoSize, Orientation } from '../../api.generated';
/** Brand lock-up — a mark paired with a product name.
 *
 *  `mark` and `name` are required on purpose: Arena ships MIT and a consumer
 *  copies this tree, so a default would ship Dravensoft's trademark to whoever
 *  never read the props. Without both, the component renders nothing.
 * @startingPoint section="Brand" subtitle="Lock-up — mark and product name" viewport="780x560" */
export interface AppLogoProps {
  /** Both halves of the lock-up at once — the mark's slot and the wordmark's
   *  size. A fixed repertoire, not a ratio: `sm` an application frame, `md` a
   *  signed-out panel, `lg` the manual's Primary, `xl` the hero case. */
  size?: LogoSize;
  orientation?: Orientation;
  /** Required. The mark as an asset — `<img src=".../rotor-crimson.svg" alt="" />`.
   *  Passed rather than drawn so the call site names which brand it renders. */
  mark: React.ReactNode;
  /** Required. The product name, or its first half when `dim` carries the second. */
  name: string;
  /** The wordmark's second half, rendered in `--mute`. Present for the manual's
   *  Primary variant, absent for Monochrome — which is why there is no `variant`
   *  prop: the mark's ink and this are the same two decisions. */
  dim?: string;
}
export function AppLogo(props: AppLogoProps): JSX.Element | null;
