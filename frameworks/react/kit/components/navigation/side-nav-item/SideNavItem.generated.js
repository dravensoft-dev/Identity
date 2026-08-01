import React from "react";
import { rowStyle, rowGlyph } from "../side-nav/SideNavInject.generated.js";
export function SideNavItem({
  id,
  label,
  icon,
  href,
  disabled = false,
  depth = 0,
  activeId,
  indentStep = 3,
  onActivate
}) {
  if (!id)
    throw new Error("SideNavItem: `id` is required");
  if (!label)
    throw new Error("SideNavItem: `label` is required");
  const on = id === activeId;
  const shared = {
    "aria-current": on ? "page" : undefined,
    "aria-disabled": disabled ? "true" : undefined,
    onClick: (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (onActivate)
        onActivate(id);
    },
    style: rowStyle({
      indentStep,
      depth,
      background: on ? "var(--crimson-soft)" : "transparent",
      color: on ? "var(--crimson)" : "var(--mute)",
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      textDecoration: "none",
      fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)"
    })
  };
  const glyph = rowGlyph(icon);
  return href ? React.createElement("a", {
    href,
    ...shared
  }, glyph, label) : React.createElement("button", {
    type: "button",
    ...shared
  }, glyph, label);
}
