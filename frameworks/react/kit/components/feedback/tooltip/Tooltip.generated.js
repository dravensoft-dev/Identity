import React, { useEffect, useId, useRef, useState } from "react";
import { delayOpen, delayClose } from "../../../Tokens.generated.js";
let injected = false;
function useFadeKeyframes() {
  useEffect(() => {
    if (injected || typeof document === "undefined")
      return;
    injected = true;
    const s = document.createElement("style");
    s.setAttribute("data-arena-tooltip", "");
    s.textContent = "@keyframes arena-fade{from{opacity:0}to{opacity:1}}";
    document.head.appendChild(s);
  }, []);
}
export function Tooltip({ children, label }) {
  if (!label)
    throw new Error("Tooltip: `label` is required");
  if (!React.isValidElement(children) || children.type === React.Fragment) {
    throw new Error("Tooltip: `children` must be a single element that forwards props to its own DOM node. " + "A fragment or a bare string takes aria-describedby nowhere, so the bubble names nothing.");
  }
  useFadeKeyframes();
  const [show, setShow] = useState(false);
  const bubbleId = `tooltip-${useId().replace(/:/g, "")}`;
  const timer = useRef(null);
  const clear = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const schedule = (next, ms) => {
    clear();
    timer.current = setTimeout(() => setShow(next), ms);
  };
  const now = (next) => {
    clear();
    setShow(next);
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (!show || typeof document === "undefined")
      return;
    const onEscape = (e) => {
      if (e.key === "Escape")
        now(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [show]);
  const own = children.props["aria-describedby"];
  const describedBy = show ? [own, bubbleId].filter(Boolean).join(" ") : own;
  const described = React.cloneElement(children, { "aria-describedby": describedBy });
  const wrapRef = useRef(null);
  useEffect(() => {
    const el = wrapRef.current && wrapRef.current.firstElementChild;
    if (!el)
      return;
    if (describedBy)
      el.setAttribute("aria-describedby", describedBy);
    else
      el.removeAttribute("aria-describedby");
  }, [describedBy]);
  return React.createElement("span", {
    ref: wrapRef,
    style: { position: "relative", display: "inline-flex" },
    onMouseEnter: () => schedule(true, delayOpen),
    onMouseLeave: () => schedule(false, delayClose),
    onFocus: () => now(true),
    onBlur: () => now(false)
  }, described, show && React.createElement("span", {
    role: "tooltip",
    id: bubbleId,
    style: {
      position: "absolute",
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%) translateY(calc(var(--sp-2) * -1))",
      whiteSpace: "nowrap",
      padding: "calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)",
      background: "var(--bone)",
      color: "var(--ink)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--dz-text-xs)",
      borderRadius: "var(--r-sm)",
      boxShadow: "var(--shadow-2)",
      zIndex: "var(--z-tooltip)",
      animation: "arena-fade var(--dur-fast) var(--ease-out)"
    }
  }, label));
}
