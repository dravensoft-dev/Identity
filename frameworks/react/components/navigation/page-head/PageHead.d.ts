import * as React from 'react';
import type { PageHeadAlign } from '../../api.generated';

/** The title block at the top of a page: h1, optional subtitle, optional actions.
 *  Stacks below --bp-sm, measured on its own container rather than the viewport. */
export interface PageHeadProps {
  /** Renders as the page's h1. One per page. */
  title: string;
  /** Small muted line under the title. A fragment, not a paragraph. */
  subtitle?: string;
  /** @startingPoint One primary Button plus at most two secondary/ghost ones. */
  actions?: React.ReactNode;
  /** Cross-axis alignment of the actions block against the title, wide layout only. */
  align?: PageHeadAlign;
}
export function PageHead(props: PageHeadProps): JSX.Element;
