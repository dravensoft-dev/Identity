import React, { useId, useRef, useState } from 'react';

export interface TabsProps {

  children?: React.ReactNode;

  value?: string;

  defaultValue?: string;

  onChange?: (value: string) => void;
}


interface TabInjected {
  value?: string;
  children?: React.ReactNode;
  selected: boolean;
  tabStop: boolean;
  tabId: string;
  panelId: string;
  onSelect: (value: string) => void;
}

export function Tabs({ children, value, defaultValue, onChange }: TabsProps) {

  const base = `tabs-${useId().replace(/:/g, '')}`;

  const items = React.Children.toArray(children)
    .filter((c): c is React.ReactElement<Partial<TabInjected>> => React.isValidElement(c));
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.props.value);
  const active = value ?? internal;

  const at = items.findIndex((c) => c.props.value === active);
  const stop = at === -1 ? 0 : at;
  const listRef = useRef<HTMLDivElement | null>(null);
  const select = (v: string) => { setInternal(v); onChange && onChange(v); };

  const tabId = (i: number) => `${base}-tab-${i}`;
  const panelId = (i: number) => `${base}-panel-${i}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

    if (items.length === 0) return;
    e.preventDefault();
    const next = (stop + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    const target = items[next];
    if (target?.props.value !== undefined) select(target.props.value);
    const buttons = listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [];
    buttons[next]?.focus();
  };

  return (
    <>
      <div role="tablist" ref={listRef} onKeyDown={onKeyDown}
        style={{
          display: 'flex', gap: 'calc(var(--sp-1) * 1)',
          borderBottom: 'var(--bw) solid var(--color-base-300)',
        }}>
        {items.map((child, i) => React.cloneElement(child, {
          selected: i === at,

          tabStop: i === stop,
          tabId: tabId(i),
          panelId: panelId(i),
          onSelect: select,
        }))}
      </div>
      {

}
      {items.map((child, i) => (

        <div key={child.key} role="tabpanel" tabIndex={i === at ? 0 : -1}
          id={panelId(i)} aria-labelledby={tabId(i)} hidden={i !== at}
          style={{ paddingBlockStart: 'calc(var(--sp-1) * 5.5)', display: i === at ? 'block' : 'none' }}>
          {child.props.children}
        </div>
      ))}
    </>
  );
}
