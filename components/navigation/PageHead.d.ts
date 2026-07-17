import * as React from 'react';

/** The title block at the top of a page: h1, optional subtitle, optional actions.
 *  Stacks below --bp-sm, measured on its own container rather than the viewport. */
export interface PageHeadProps {
  /** Renders as the page's h1. One per page. */
  title: string;
  /** Small muted line under the title. A fragment, not a paragraph. */
  subtitle?: string;
  /** @startingPoint One primary Button plus at most two secondary/ghost ones. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export function PageHead(props: PageHeadProps): JSX.Element;
