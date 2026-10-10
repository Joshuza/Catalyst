import { z } from 'zod';
import { date, cents, short, text, url } from './profile';
export const extendedSchemas = [
  z
    .object({
      type: z.literal('research'),
      url,
      body: text,
      image: z
        .string()
        .max(3000000)
        .refine(
          (v) =>
            v === '' ||
            /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(v),
          'Only local PNG, JPEG, or WebP images are accepted.',
        ),
      tags: z.array(short).max(30),
      priority: z.enum(['Researching', 'Nice to have', 'Must have']),
      pros: text,
      cons: text,
      costCents: cents.refine((v) => v >= 0),
      purchaseId: short.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('goal'),
      targetCents: cents.refine((v) => v > 0),
      reservedCents: cents.refine((v) => v >= 0),
      date,
      currency: z.string().regex(/^[A-Z]{3}$/),
    })
    .strict()
    .refine(
      (v) => v.reservedCents <= v.targetCents,
      'Reserved funds cannot exceed the target.',
    ),
  z
    .object({
      type: z.literal('habit'),
      dates: z.array(date).max(3660),
      screenLimit: z.number().min(0).max(24).nullable(),
      target: z.enum(['Daily routine', 'Screen limit', 'Savings review']),
    })
    .strict(),
  z
    .object({
      type: z.literal('health'),
      date,
      category: z.enum([
        'Checkup',
        'Dental',
        'Eye care',
        'Prescription',
        'Other',
      ]),
      notes: text,
      completed: z.boolean(),
      repeatMonths: z.number().int().min(0).max(60),
      eventId: short.nullable(),
    })
    .strict(),
  z
    .object({
      type: z.literal('audio'),
      url,
      category: z.enum(['Podcast', 'Music']),
      context: z.enum(['Deep work', 'Chores', 'Commute', 'Any']),
      tags: z.array(short).max(30),
      minutes: z.number().int().min(1).max(1440),
      played: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal('itinerary'),
      startDate: date,
      endDate: date,
      eventIds: z.array(short).max(300),
      notes: text,
    })
    .strict()
    .refine((v) => v.endDate >= v.startDate, 'Trip must end after it starts.'),
] as const;
