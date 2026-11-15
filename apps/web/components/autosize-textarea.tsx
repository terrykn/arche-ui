"use client";

import * as React from "react";

/**
 * Single-line-look textarea that grows to fit its content with no row cap
 * (the character limit still bounds it). Reports single- vs multi-line via
 * `onExpandChange` so the surrounding pill can relax its corner radius once
 * the text wraps.
 */
export function AutosizeTextarea({
  onChange,
  onInput,
  onExpandChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  onExpandChange?: (expanded: boolean) => void;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const expandedRef = React.useRef(false);

  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const chrome =
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom) +
      parseFloat(cs.borderTopWidth) +
      parseFloat(cs.borderBottomWidth);
    const border =
      parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + border}px`;
    el.style.overflowY = "hidden";
    const expanded = el.scrollHeight > line + chrome + 1;
    if (expanded !== expandedRef.current) {
      expandedRef.current = expanded;
      onExpandChange?.(expanded);
    }
  }, [onExpandChange]);

  // Refit after every render: covers controlled value changes and mounts
  // with a prefilled defaultValue.
  React.useEffect(() => {
    fit();
  });

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onChange={(event) => {
        onChange?.(event);
        fit();
      }}
      onInput={(event) => {
        onInput?.(event);
        fit();
      }}
    />
  );
}
