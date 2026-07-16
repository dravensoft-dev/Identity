import React, { useState } from 'react';
export function Tooltip({ children, content, style }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)',
          whiteSpace: 'nowrap', padding: '6px 10px', background: 'var(--bone)', color: 'var(--ink)',
          fontFamily: 'var(--font-mono)', fontSize: 11, borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', zIndex: 900,
          animation: 'arena-fade var(--dur-fast) var(--ease-out)' }}>
          {content}
          <style>{'@keyframes arena-fade{from{opacity:0}to{opacity:1}}'}</style>
        </span>
      )}
    </span>
  );
}
