Arena chart tile — the card a chart sits on, with a mono microlabel and an optional
action slot. It is not a heading: a dashboard is a grid of tiles, and one `h2` per tile
invents a document outline. The chart inside carries the accessible name through its
own `role="img"`.

```html
<arena-chart-card title="Deployments per week">
  <button actions mat-icon-button aria-label="Export"><i class="ph-bold ph-download-simple"></i></button>
  <arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" />
</arena-chart-card>
```

Import `ArenaActions` from `frameworks/angular/primitives/projection-markers` (or the
primitives barrel) alongside `ChartCard` in the host component's `imports` —
`actions` is a directive, not a plain attribute, because it is how the card
detects that actions were projected at all. Without it the attribute is inert, the
head row never renders when there is no title, and the button silently disappears.
`ArenaActions` is shared: every primitive with a plural, toolbar-shaped projected slot
imports the same directive rather than declaring its own — `arena-page-head` is the
other consumer.

The head row (title plus actions) renders only when one of them is actually present.
With neither, no empty row ships dead space above the chart.

**Do / Don't**
- Keep the title short and in the tile's own words. It is a label, not a sentence.
- Don't put two charts in one card. A card is one question answered once.
- Don't reach for this as a general card — that is `mat-card` wearing Arena.
