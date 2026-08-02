import React from 'react';
import { createRoot } from 'react-dom/client';
import type { GridGap } from '../../../Api.generated';
import { Grid } from './Grid.tsx';

const GAPS: GridGap[] = ['none', 'md', 'lg'];

const cells = (count: number, label = 'Cell') =>
  Array.from({ length: count }, (_, i) => <div className="cell" key={i}>{label} {i + 1}</div>);

function Card() {
  return (
    <React.Fragment>
      {GAPS.map((gap) => (
        <React.Fragment key={gap}>
          <div className="sub">gap=&quot;{gap}&quot;{gap === 'md' ? ' — the default' : ''}</div>
          <div className="frame"><Grid gap={gap}>{cells(4)}</Grid></div>
        </React.Fragment>
      ))}

      <div className="sub">A min wider than the frame gives one clamped column, never an overflow</div>
      <div className="frame">
        <Grid min="calc(var(--sp-1) * 400)">{cells(3, 'Wide cell')}</Grid>
      </div>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<Card />);
