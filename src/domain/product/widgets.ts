import { z } from 'zod';

export const widgetIds = [
  'briefing',
  'create',
  'calendar',
  'inbox',
  'tasks',
  'reading',
  'goals',
  'itineraries',
  'finance',
  'receipts',
  'food',
  'transit',
  'outdoors',
  'health',
  'habits',
  'audio',
  'contacts',
  'pet',
  'screen',
  'reset',
  'research',
  'records',
  'profile',
  'connections',
] as const;
export type WidgetId = (typeof widgetIds)[number];
export const widgetSizes = ['small', 'medium', 'large'] as const;
export type WidgetSize = (typeof widgetSizes)[number];
export const widgetLayoutSchema = z
  .array(
    z
      .object({
        id: z.enum(widgetIds),
        size: z.enum(widgetSizes),
      })
      .strict(),
  )
  .max(widgetIds.length)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    'A widget can appear only once.',
  );
export type WidgetLayout = z.infer<typeof widgetLayoutSchema>;
export const defaultWidgetLayout: WidgetLayout = [
  { id: 'finance', size: 'large' },
  { id: 'calendar', size: 'medium' },
  { id: 'inbox', size: 'small' },
  { id: 'tasks', size: 'small' },
  { id: 'create', size: 'medium' },
  { id: 'research', size: 'medium' },
];
export const coreWidgets: readonly WidgetId[] = [
  'finance',
  'calendar',
  'inbox',
];
export const sectionForWidget: Partial<Record<WidgetId, string>> = {
  calendar: 'schedule',
  finance: 'finance',
  inbox: 'inbox',
};
export function widgetLayout(
  saved: WidgetLayout | undefined,
  petEnabled: boolean,
) {
  return (saved ?? defaultWidgetLayout).filter(
    (item) => petEnabled || item.id !== 'pet',
  );
}
export function resizeWidget(
  layout: WidgetLayout,
  id: WidgetId,
  size: WidgetSize,
): WidgetLayout {
  return widgetLayoutSchema.parse(
    layout.some((item) => item.id === id)
      ? layout.map((item) => (item.id === id ? { id, size } : item))
      : [...layout, { id, size }],
  );
}
