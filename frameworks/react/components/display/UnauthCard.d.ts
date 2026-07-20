import * as React from 'react';
/** The panel a signed-out screen needs — sign in, check your inbox,
 *  this link expired, enter your two-factor code.
 *
 *  It knows nothing about credentials on purpose: the moment it knew about a
 *  password field it would stop serving the other three. Fields are composed
 *  from Input and Button.
 * @startingPoint section="Display" subtitle="Signed-out panel" viewport="700x560" */
export interface UnauthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The brand lock-up above the panel's content. An <AppLogo>, in practice. */
  brand?: React.ReactNode;
  /** Mono crimson microlabel — the product, not the task. */
  eyebrow?: React.ReactNode;
  /** The task. "Welcome back", "Check your inbox". */
  title?: React.ReactNode;
  /** Centred muted line below the content — a recovery link, a legal note. */
  footer?: React.ReactNode;
  /** The fields, composed from Input and Button. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function UnauthCard(props: UnauthCardProps): JSX.Element;
