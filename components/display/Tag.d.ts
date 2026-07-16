import * as React from 'react';
/** Chip para filtros, tecnologías, etiquetas. `onRemove` muestra la × de descarte. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
