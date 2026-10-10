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
