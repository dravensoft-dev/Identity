import React from 'react';
/** Brand symbol. spin=true loops rotation (use only in loading/splash). */
export function Rotor({ size = 48, color = 'var(--crimson)', spin = false, style, ...rest }) {
  const blade = 'M50 50 L92 64.3 L75.2 75.2 L64.3 92 Z';
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, ...style }} {...rest}>
      <svg viewBox="0 0 100 100" width={size} height={size} fill={color}
        style={spin ? { animation: 'arena-rotor 8s linear infinite', transformOrigin: '50% 50%' } : undefined}>
        <path d={blade} />
        <path d={blade} transform="rotate(120 50 50)" />
        <path d={blade} transform="rotate(240 50 50)" />
        {spin && <style>{'@keyframes arena-rotor{to{transform:rotate(360deg)}}'}</style>}
      </svg>
    </span>
  );
}
