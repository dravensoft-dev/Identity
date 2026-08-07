import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaLegendWidth, arenaLegendPlotWidth, arenaLegendStacked } from './ChartLegend';

test('the legend takes 34% of a mid-size container', () => {
  assert.ok(Math.abs(arenaLegendWidth(400) - 136) < 1e-9);
});

test('the legend never falls below its floor, however narrow the container', () => {

  for (const width of [0, 1, 100, 352]) assert.equal(arenaLegendWidth(width), 120, `at width ${width}`);
});

test('the legend never exceeds its ceiling, however wide the container', () => {
  for (const width of [530, 600, 4000]) assert.equal(arenaLegendWidth(width), 180, `at width ${width}`);
});

test('the plot is what is left after the legend and the gap between them', () => {
  assert.equal(arenaLegendPlotWidth(600), 600 - 180 - 16);
});

test('the plot width stays positive even in a container narrower than the legend alone', () => {
  for (const width of [0, 1, 50, 120]) {
    const plot = arenaLegendPlotWidth(width);
    assert.ok(plot >= 1, `plot width was ${plot} at container width ${width}`);
  }
});

test('the plot and the legend and the gap never claim more than the container has', () => {
  for (const width of [200, 400, 600, 1200]) {
    const used = arenaLegendPlotWidth(width) + arenaLegendWidth(width) + 16;
    assert.ok(used <= width + 1e-9, `the layout claimed ${used} of a ${width}px container`);
  }
});

test('an explicit layout is obeyed at every width, because the caller measured something this cannot', () => {

  for (const width of [100, 400, 4000]) {
    assert.equal(arenaLegendStacked('stacked', width), true, `stacked at ${width}`);
    assert.equal(arenaLegendStacked('inline', width), false, `inline at ${width}`);
  }
});

test('auto stacks exactly while the legend column is narrower than its ceiling', () => {

  assert.equal(arenaLegendStacked('auto', 400), true, 'a 136px column stacks');
  assert.equal(arenaLegendStacked('auto', 4000), false, 'a column at the 180px ceiling goes inline');
});

test('the auto threshold is the ceiling itself, so a legend at its widest is the inline one', () => {
  const atCeiling = [...Array(40).keys()].map((i) => 500 + i * 10).find((w) => arenaLegendWidth(w) === 180);
  assert.ok(atCeiling !== undefined, 'no width in the sweep reached the ceiling');
  assert.equal(arenaLegendStacked('auto', atCeiling), false);
});
