export type BriefingContext = {
  weekend: boolean;
  deepWork: boolean;
  urgent: boolean;
  daysAway: number;
  pinned: string[];
  hidden: string[];
};
export function briefingSections(context: BriefingContext): string[] {
  const list = context.deepWork
    ? ['finance', 'schedule', 'tasks', 'inbox']
    : [
        'finance',
        'schedule',
        'inbox',
        'reading',
        ...(context.weekend ? ['outdoors', 'reset'] : ['tasks']),
      ];
  if (context.urgent) list.unshift('sentinel');
  if (context.daysAway >= 3) list.unshift('catchup');
  return [...new Set([...context.pinned, ...list])].filter(
    (id) => context.pinned.includes(id) || !context.hidden.includes(id),
  );
}

/** Quiet defaults never conceal urgent, catch-up, or explicitly pinned sections. */
export function compactBriefing(
  sections: string[],
  pinned: string[],
  more: boolean,
) {
  const essential = new Set([
    'finance',
    'schedule',
    'inbox',
    'sentinel',
    'catchup',
    ...pinned,
  ]);
  return more ? sections : sections.filter((id) => essential.has(id));
}
