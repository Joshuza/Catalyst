import { z } from 'zod';
import { forecastSchema } from './weather';
import { extendedSchemas } from './extended';
import {
  date,
  cents,
  short,
  text,
  url,
  modeSchema,
  dietaryTags,
  activityTypes,
  shiftSchema,
} from './profile';
const routeSchema = z
  .object({
    mode: modeSchema,
    minutes: z.number().positive().max(10000),
    walkingMiles: z.number().min(0).max(100),
    distanceMiles: z.number().min(0).max(10000),
  })
  .strict();
const placeShape = {
  address: short,
  dietary: z.array(z.enum(dietaryTags)).max(7),
  routes: z.array(routeSchema).max(20),
};
export const moduleSchema = z.discriminatedUnion('type', [
  ...extendedSchemas,
  z
    .object({
      type: z.literal('purchase'),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .optional(),
      costCents: cents.refine((v) => v > 0),
      date,
      status: z.enum(['wishlist', 'planned', 'bought', 'canceled']),
      scenario: short,
      actualCents: cents.nullable(),
      regret: z.number().int().min(1).max(5).nullable(),
      emotion: z
        .enum(['Essential', 'Joyful', 'Impulsive', 'Regretted'])
        .nullable(),
      transactionId: short.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('scenario'),
      name: short.min(1),
      payPercent: z.number().int().min(0).max(200).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('subscription'),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .optional(),
      billingAnchor: date.optional(),
      paidCharges: z
        .array(
          z
            .object({
              date,
              scheduledDate: date,
              totalCents: cents,
              transactionId: short,
            })
            .strict(),
        )
        .max(1200)
        .optional(),
      amountCents: cents.refine((v) => v >= 0),
      cadence: z.enum(['monthly', 'annual']),
      nextDate: date,
      trialEnd: date.nullable(),
      trialEndAt: z.iso.datetime().optional(),
      billingUrl: url,
    })
    .strict(),
  z
    .object({
      type: z.literal('event'),
      date,
      start: z.number().min(0).lt(24),
      minutes: z.number().int().positive().max(1440),
      category: z.enum(['work', 'personal', 'focus', 'travel', 'outing']),
      taskId: short.nullable(),
      travelMinutes: z.number().int().min(0).max(1440),
      location: short,
      ticket: z.enum(['none', 'event', 'flight', 'train']),
      reference: short,
      ticketUrl: url.optional(),
      purchaseId: short.nullable().optional(),
    })
    .strict()
    .refine(
      (e) => e.start * 60 + e.minutes <= 1440,
      'Event must finish within the day.',
    ),
  z
    .object({
      type: z.literal('grocery'),
      requiredQuantity: z.number().min(0).max(100000).optional(),
      name: short.min(1),
      quantity: z.number().min(0).max(100000),
      unit: short,
      section: short,
      checked: z.boolean(),
      tripId: short.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('pantry'),
      name: short.min(1),
      quantity: z.number().min(0).max(100000),
      unit: short,
    })
    .strict(),
  z.object({ type: z.literal('place'), ...placeShape }).strict(),
  z
    .object({
      type: z.literal('trail'),
      ...placeShape,
      distanceMiles: z.number().positive().max(1000),
      elevationFeet: z.number().min(0).max(50000),
      minutes: z.number().int().positive().max(1440),
      difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
      loop: z.boolean(),
      dogFriendly: z.boolean(),
      activity: z.enum(activityTypes),
      elevation: z.array(z.number()).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal('outing'),
      trailId: short,
      date,
      eventId: short,
      forecast: forecastSchema.optional(),
      route: z
        .object({
          mode: modeSchema,
          minutes: z.number().positive(),
          departure: z.number().min(0).max(24),
          backBy: z.number().min(0).max(24),
        })
        .strict()
        .optional(),
      gear: z
        .array(
          z
            .object({
              name: short,
              owned: z.boolean(),
              costCents: cents.refine((v) => v >= 0),
            })
            .strict(),
        )
        .max(30),
    })
    .strict(),
  z
    .object({
      type: z.literal('activity'),
      date,
      activity: z.enum(activityTypes),
      miles: z.number().min(0).max(1000),
      elevationFeet: z.number().min(0).max(50000),
    })
    .strict(),
  z
    .object({
      type: z.literal('pet'),
      category: z.enum([
        'Vet',
        'Vaccination',
        'Food',
        'Prescription',
        'Weight',
      ]),
      weightKg: z.number().positive().max(10000).optional(),
      date,
      notes: text,
      completed: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal('contact'),
      email: short,
      birthday: date.nullable(),
      rhythmDays: z.number().int().positive().max(730),
      lastContact: date,
      trusted: z.boolean(),
      gifts: text,
      logs: z.array(z.object({ date, note: text }).strict()).max(500),
    })
    .strict(),
  z
    .object({
      type: z.literal('screen'),
      date,
      hours: z.number().min(0).max(24),
      focusHours: z.number().min(0).max(24),
    })
    .strict(),
  z
    .object({
      type: z.literal('reset'),
      date,
      steps: z.array(z.enum(['done', 'skipped'])).max(3),
    })
    .strict(),
  z
    .object({
      type: z.literal('news'),
      source: short,
      url,
      date,
      minutes: z.number().int().min(1).max(120),
      read: z.boolean(),
      muted: z.boolean(),
      pausedUntil: date.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('rule'),
      sender: short,
      stream: z.enum(['work', 'personal', 'promotional']),
      corrections: z.number().int().min(1).max(10000),
    })
    .strict(),
  z
    .object({
      type: z.literal('receipt'),
      filename: short,
      mime: z.enum([
        'application/pdf',
        'image/png',
        'image/jpeg',
        'text/plain',
      ]),
      file: z.string().max(28000000),
      vendor: short,
      date,
      totalCents: cents.refine((v) => v >= 0),
      taxCents: cents.refine((v) => v >= 0),
      items: z.array(short).max(300),
      confidence: z.number().min(0).max(1),
      accepted: z.boolean(),
      transactionId: short.nullable(),
      purchaseId: short.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('vendorRule'),
      vendor: short,
      taxRate: z.number().min(0).max(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('override'),
      until: date,
      modes: z.array(modeSchema).max(7),
      shifts: z.array(shiftSchema).max(21),
    })
    .strict(),
  z
    .object({
      type: z.literal('briefing'),
      previousVisit: date.nullable().optional(),
      focusEventId: short.nullable().optional(),
      lastVisit: date,
      deepWork: z.boolean(),
      activeTask: short,
      hidden: z.array(short).max(20),
      pinned: z.array(short).max(20),
      expanded: z.array(short).max(20),
    })
    .strict(),
]);
export type ModuleData = z.infer<typeof moduleSchema>;
export type DataOf<T extends ModuleData['type']> = Extract<
  ModuleData,
  { type: T }
>;
