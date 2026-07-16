import * as React from 'react';
/** Etiqueta de estado (mono mayúsculas, corta). Taxonomía de `tone` (H4):
 *  · Tonos de ESTADO del sistema — success / warning / danger / info: reflejan el estado real de
 *    un objeto (deploy, servicio, versión). No los uses por decoración.
 *  · Tonos de ÉNFASIS — accent (novedad/destacado) y gold (prioridad/distinción): editoriales,
 *    no representan estado. `neutral` = sin carga semántica (borrador, recuento). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
