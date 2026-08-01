import React, { useId, useRef, useState } from "react";
export function Tabs({ children, value, defaultValue, onChange }) {
  const base = `tabs-${useId().replace(/:/g, "")}`;
  const items = React.Children.toArray(children).filter((c) => React.isValidElement(c));
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.props.value);
  const active = value ?? internal;
  const at = items.findIndex((c) => c.props.value === active);
  const stop = at === -1 ? 0 : at;
  const listRef = useRef(null);
  const select = (v) => {
    setInternal(v);
    onChange && onChange(v);
  };
  const tabId = (i) => `${base}-tab-${i}`;
  const panelId = (i) => `${base}-panel-${i}`;
  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight")
      return;
    if (items.length === 0)
      return;
    e.preventDefault();
    const next = (stop + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    const target = items[next];
    if (target?.props.value !== undefined)
      select(target.props.value);
    const buttons = listRef.current?.querySelectorAll('[role="tab"]') ?? [];
    buttons[next]?.focus();
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    role: "tablist",
    ref: listRef,
    onKeyDown,
    style: {
      display: "flex",
      gap: "calc(var(--sp-1) * 1)",
      borderBottom: "var(--bw) solid var(--color-base-300)"
    }
  }, items.map((child, i) => React.cloneElement(child, {
    selected: i === at,
    tabStop: i === stop,
    tabId: tabId(i),
    panelId: panelId(i),
    onSelect: select
  }))), items.map((child, i) => React.createElement("div", {
    key: child.key,
    role: "tabpanel",
    tabIndex: i === at ? 0 : -1,
    id: panelId(i),
    "aria-labelledby": tabId(i),
    hidden: i !== at,
    style: { paddingBlockStart: "calc(var(--sp-1) * 5.5)", display: i === at ? "block" : "none" }
  }, child.props.children)));
}
