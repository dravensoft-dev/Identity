export interface ArenaChartTableRow {
  header: string;
  cells: string[];
}

export interface ArenaChartTable {
  columns: string[];
  rows: ArenaChartTableRow[];
}

export function arenaChartTable(
  heading: string,
  seriesLabel: string,
  labels: readonly string[],
  values: readonly number[],
  write: (value: number) => string,
): ArenaChartTable {
  return {
    columns: [heading, seriesLabel],
    rows: values.map((value, index) => ({ header: labels[index] ?? '', cells: [write(value)] })),
  };
}
