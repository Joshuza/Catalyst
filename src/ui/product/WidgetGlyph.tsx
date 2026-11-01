const paths = {
  expand: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
  restore: 'M8 3v5H3M16 3v5h5M21 16h-5v5M8 21v-5H3',
  close: 'M6 6l12 12M18 6 6 18',
};
export function WidgetGlyph({
  kind = 'expand',
}: {
  kind?: keyof typeof paths;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
