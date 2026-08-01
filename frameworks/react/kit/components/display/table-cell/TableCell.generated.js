import React from "react";
export const HEADER_LABEL = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--dz-text-2xs)",
  letterSpacing: "var(--ls-column-header)",
  textTransform: "uppercase",
  color: "var(--mute)",
  fontWeight: "var(--fw-bold)"
};
export const CELL_BASE = {
  padding: "var(--dz-row-py) var(--dz-row-px)",
  fontSize: "var(--dz-text)",
  textAlign: "left",
  verticalAlign: "middle"
};
export const valueStyle = (column) => ({
  fontFamily: column.mono ? "var(--font-mono)" : "var(--font-body)",
  color: column.mono ? "var(--gold)" : "var(--bone-dim)"
});
export function TableCell({
  children,
  column,
  layout = "table",
  tabIndex,
  focused = false,
  onCellFocus
}) {
  const c = column ?? {};
  if (layout === "card") {
    if (c.mobileLayout === "block") {
      return React.createElement("div", {
        style: {
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "calc(var(--sp-1) * 2)",
          borderTop: "var(--bw) solid var(--color-base-300)",
          paddingTop: "calc(var(--sp-1) * 2)"
        }
      }, children);
    }
    return React.createElement("div", {
      style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "calc(var(--sp-1) * 3)" }
    }, React.createElement("span", {
      style: HEADER_LABEL
    }, c.header), React.createElement("span", {
      style: { ...valueStyle(c), minWidth: 0, textAlign: "right", fontSize: "var(--dz-text)" }
    }, children));
  }
  return React.createElement("td", {
    role: "gridcell",
    tabIndex,
    onFocus: onCellFocus ? (e) => {
      if (e.target === e.currentTarget)
        onCellFocus();
    } : undefined,
    style: {
      ...CELL_BASE,
      ...valueStyle(c),
      textAlign: c.align || "left",
      outline: "none",
      boxShadow: focused ? "inset 0 0 0 var(--focus-width) var(--focus-ring)" : undefined
    }
  }, children);
}
