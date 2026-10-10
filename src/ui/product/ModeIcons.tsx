import type { ReactNode } from 'react';
const paths: Record<string, string> = {
  car: 'M3 17V9l2-4h14l2 4v8M3 10h18M6 17v3M18 17v3M6 13h2M16 13h2',
  bicycle:
    'M8 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm16 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 17l6-9 10 9M10 8l4 9H4M9 5h4M16 4h3l2 4',
  walk: 'M12 5v4l-4 4M12 9l5 3M12 9l-2 7-4 6M10 16l6 6M13 1v2',
  train: 'M5 17V4h14v13H5ZM5 10h14M8 20l-3 3M16 20l3 3M8 14h1M15 14h1',
  subway: 'M5 20V9a7 7 0 0 1 14 0v11M8 17V8h8v9H8ZM8 12h8',
  bus: 'M4 18V5h16v13H4ZM4 11h16M7 18v3M17 18v3M7 14h1M16 14h1',
  ferry: 'M3 17l9 5 9-5-9-3-9 3ZM7 15V8h10v7M12 8V2M2 23l3-1 4 1 3-1 4 1 5-1',
};
export const modeIcons: Record<string, ReactNode> = Object.fromEntries(
  Object.entries(paths).map(([mode, d]) => [
    mode,
    <svg
      key={mode}
      width="var(--space-5)"
      height="var(--space-5)"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={d} />
    </svg>,
  ]),
);
