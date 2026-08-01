import React, { useEffect } from "react";
let injected = false;
function useFocusRing() {
  useEffect(() => {
    if (injected || typeof document === "undefined")
      return;
    injected = true;
    const s = document.createElement("style");
    s.setAttribute("data-arena-radio", "");
    s.textContent = ".arena-radio-ring:has(~ input:focus-visible)" + "{box-shadow:0 0 0 var(--focus-width) var(--gold-soft)}";
    document.head.appendChild(s);
  }, []);
}
export function Radio({ value, label, hint, name, checked = false, onSelect, disabled = false }) {
  if (!value)
    throw new Error("Radio: `value` is required");
  useFocusRing();
  return React.createElement("label", {
    style: { display: "inline-flex", alignItems: "flex-start", gap: "calc(var(--sp-1) * 2.5)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }
  }, React.createElement("span", {
    className: "arena-radio-ring",
    style: {
      width: "calc(var(--sp-1) * 5)",
      height: "calc(var(--sp-1) * 5)",
      borderRadius: "50%",
      flexShrink: 0,
      marginTop: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-input)",
      border: "var(--bw) solid " + (checked ? "var(--crimson)" : "var(--line-strong)"),
      transition: "border-color var(--dur-fast) var(--ease-out)"
    }
  }, checked && React.createElement("span", {
    style: { width: "calc(var(--sp-1) * 2.5)", height: "calc(var(--sp-1) * 2.5)", borderRadius: "50%", background: "var(--crimson)" }
  })), React.createElement("span", {
    style: { display: "flex", flexDirection: "column", gap: "calc(var(--sp-1) * 0.5)" }
  }, label && React.createElement("span", {
    style: { fontFamily: "var(--font-body)", fontSize: "var(--dz-text)", color: "var(--bone-dim)", lineHeight: "var(--lh-snug)" }
  }, label), hint && React.createElement("span", {
    style: { fontFamily: "var(--font-body)", fontSize: "var(--dz-text-sm)", color: "var(--mute)", lineHeight: "var(--lh-body)" }
  }, hint)), React.createElement("input", {
    type: "radio",
    name,
    value,
    checked,
    disabled,
    onChange: () => onSelect && onSelect(value),
    style: { position: "absolute", opacity: 0, width: 0, height: 0 }
  }));
}
