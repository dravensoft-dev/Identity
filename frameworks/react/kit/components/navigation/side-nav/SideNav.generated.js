import React from "react";
import { injectInto, COLUMN } from "./SideNavInject.generated.js";
export function SideNav({ children, active, ariaLabel, indentStep = 3, onNav }) {
  if (!ariaLabel?.trim())
    throw new Error("SideNav: `ariaLabel` is required");
  return React.createElement("nav", {
    "aria-label": ariaLabel,
    style: COLUMN
  }, injectInto(children, { depth: 0, activeId: active, indentStep, onActivate: onNav }));
}
