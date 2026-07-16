import React, { useState } from 'react';
const SZ = { sm: 32, md: 40, lg: 48 };
/** Botón solo-icono. `label` es obligatorio (nombre accesible en TODOS los estados, no solo hover).
 * `showLabel` (H6): muestra el texto junto al icono donde hay espacio — no dependas solo del tooltip
 * en superficies táctiles o de teclado. */
export function IconButton({ children, size = 'md', variant = 'ghost', label, showLabel = false, disabled = false, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const d = SZ[size] || SZ.md;
  const bg = variant === 'solid'
    ? (hover ? 'var(--crimson-strong)' : 'var(--crimson)')
    : (hover ? 'var(--panel)' : 'transparent');
  const color = variant === 'solid' ? 'var(--on-accent)' : 'var(--bone-dim)';
  return (
    <button aria-label={label} title={showLabel ? undefined : label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height: d, width: showLabel ? 'auto' : d, minWidth: d, padding: showLabel ? '0 14px 0 12px' : 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: showLabel ? 8 : 0,
        background: bg, color, border: variant === 'solid' ? 'none' : '1px solid var(--line)',
        borderRadius: 'var(--r-sm)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)', ...style }} {...rest}>
      {children}
      {showLabel && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, lineHeight: 1 }}>{label}</span>}
    </button>
  );
}
