import React from "react";
export function injectInto(children, injected) {
  return React.Children.toArray(children).map((child) => React.isValidElement(child) ? React.cloneElement(child, injected) : child);
}
export function indentFor(indentStep, depth) {
  const steps = indentStep * depth;
  return steps === 0 ? "calc(var(--sp-1) * 3)" : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}
export const COLUMN = { display: "flex", flexDirection: "column", gap: "var(--sp-1)" };
export function rowStyle({
  indentStep,
  depth,
  background,
  color,
  fontWeight,
  textDecoration,
  opacity,
  cursor
}) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "calc(var(--sp-1) * 3)",
    paddingBlock: "calc(var(--sp-1) * 2.5)",
    paddingInlineEnd: "calc(var(--sp-1) * 3)",
    paddingInlineStart: indentFor(indentStep, depth),
    borderRadius: "var(--r-sm)",
    background,
    color,
    border: "none",
    cursor: cursor ?? "pointer",
    textAlign: "left",
    textDecoration,
    opacity,
    fontFamily: "var(--font-body)",
    fontSize: "var(--dz-text)",
    fontWeight
  };
}
export function rowGlyph(icon) {
  return icon ? React.createElement("i", {
    className: icon,
    "aria-hidden": "true",
    style: { fontSize: "var(--icon-lg)", display: "inline-flex" }
  }) : null;
}
