import React from "react";
import { IconButton } from "../../forms/icon-button/IconButton.generated.js";
const KEBAB_RESERVE = "calc(var(--dz-ctl-h-sm) + var(--bw) * 2)";
export const CalendarEvent = React.forwardRef(function CalendarEvent({
  id,
  title,
  start,
  end,
  colorId,
  onClick,
  interactive = false,
  disabled = false,
  actionsEnabled = false,
  actions,
  box,
  color,
  timeLabel,
  dateLabel,
  showTime,
  actionsBelow,
  tabIndex,
  defaultPanelOpen
}, ref) {
  if (!id)
    throw new Error("CalendarEvent: `id` is required");
  if (!title)
    throw new Error("CalendarEvent: `title` is required");
  if (!start)
    throw new Error("CalendarEvent: `start` is required");
  if (!end)
    throw new Error("CalendarEvent: `end` is required");
  const hasPanel = actionsEnabled;
  const Tag = interactive && !hasPanel ? "button" : "div";
  const [panelOpen, setPanelOpen] = React.useState(Boolean(defaultPanelOpen));
  const bodyIsButton = interactive && hasPanel;
  const activate = (e) => {
    e.stopPropagation();
    if (interactive && !disabled && onClick)
      onClick();
  };
  const focusableRef = React.useRef(null);
  const kebabWrapRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const setFocusable = (node) => {
    focusableRef.current = node;
    if (typeof ref === "function")
      ref(node);
    else if (ref)
      ref.current = node;
  };
  const kebabEl = () => kebabWrapRef.current?.firstElementChild instanceof HTMLElement ? kebabWrapRef.current.firstElementChild : null;
  const openedByUser = React.useRef(false);
  React.useEffect(() => {
    if (!panelOpen || !openedByUser.current)
      return;
    openedByUser.current = false;
    const panel = panelRef.current;
    if (!panel)
      return;
    const first = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (first)
      first.focus();
  }, [panelOpen]);
  const body = React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      fontSize: "var(--dz-text-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-strong)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), showTime && React.createElement("span", {
    style: { fontFamily: "var(--font-mono)", fontSize: "var(--dz-text-2xs)", color: "var(--mute)" }
  }, timeLabel));
  return React.createElement(Tag, {
    ref: bodyIsButton ? undefined : setFocusable,
    type: interactive && !hasPanel ? "button" : undefined,
    tabIndex: bodyIsButton ? undefined : tabIndex,
    onClick: hasPanel ? undefined : activate,
    "aria-label": interactive && !hasPanel ? `${title}, ${dateLabel}, ${timeLabel}` : undefined,
    "aria-disabled": interactive && !hasPanel && disabled ? "true" : undefined,
    onKeyDown: hasPanel ? (e) => {
      if (e.key === "Escape" && panelOpen) {
        e.stopPropagation();
        setPanelOpen(false);
        const kebab = kebabEl();
        if (kebab)
          kebab.focus();
        return;
      }
      const kebab = kebabEl();
      if (!kebab)
        return;
      if (e.key === "ArrowRight" && e.target !== kebab) {
        e.preventDefault();
        e.stopPropagation();
        kebab.focus();
      } else if (e.key === "ArrowLeft" && e.target === kebab && focusableRef.current) {
        e.preventDefault();
        e.stopPropagation();
        focusableRef.current.focus();
      }
    } : undefined,
    style: {
      position: "absolute",
      ...box,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      overflow: panelOpen ? "visible" : "hidden",
      textAlign: "left",
      padding: "calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)",
      paddingRight: hasPanel && !actionsBelow ? KEBAB_RESERVE : "calc(var(--sp-1) * 1.5)",
      background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
      borderLeft: `var(--bw-strong) solid ${color}`,
      borderTop: "none",
      borderRight: "none",
      borderBottom: "none",
      borderRadius: "var(--r-sm)",
      cursor: interactive ? disabled ? "not-allowed" : "pointer" : "default",
      opacity: interactive && disabled ? 0.5 : 1,
      font: "inherit"
    }
  }, hasPanel ? React.createElement(React.Fragment, null, interactive ? React.createElement("button", {
    type: "button",
    ref: setFocusable,
    tabIndex,
    onClick: activate,
    "aria-label": `${title}, ${dateLabel}, ${timeLabel}`,
    "aria-disabled": disabled ? "true" : undefined,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 0,
      background: "none",
      border: "none",
      padding: 0,
      margin: 0,
      font: "inherit",
      color: "inherit",
      textAlign: "left",
      cursor: disabled ? "not-allowed" : "pointer"
    }
  }, body) : React.createElement("span", {
    ref: setFocusable,
    tabIndex,
    onClick: activate,
    style: { display: "flex", flexDirection: "column", gap: 0 }
  }, body), React.createElement("span", {
    ref: kebabWrapRef,
    style: { position: "absolute", right: 0, ...actionsBelow ? { bottom: 0 } : { top: 0 } }
  }, React.createElement(IconButton, {
    icon: "ph-bold ph-dots-three-vertical",
    label: "Actions",
    size: "sm",
    tabStop: false,
    onClick: () => {
      openedByUser.current = !panelOpen;
      setPanelOpen((o) => !o);
    }
  }), panelOpen && React.createElement("span", {
    ref: panelRef,
    style: {
      position: "absolute",
      top: "100%",
      right: 0,
      zIndex: 1,
      display: "flex",
      gap: "var(--sp-2)",
      padding: "var(--sp-2)",
      background: "var(--surface-card)",
      border: "var(--bw) solid var(--color-base-300)",
      borderRadius: "var(--r-sm)",
      boxShadow: "var(--shadow-2)"
    }
  }, actions))) : body);
});
