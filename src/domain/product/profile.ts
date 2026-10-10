import { z } from 'zod';
import { isValid } from 'date-fns/isValid';
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return isValid(d) && d.toISOString().slice(0, 10) === v;
  });
export const cents = z.number().int().refine(Number.isSafeInteger);
export const short = z.string().max(300);
export const text = z.string().max(20000);
export const url = z
  .string()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    try {
      const parsed = new URL(v);
      return ['http:', 'https:'].includes(parsed.protocol) && !!parsed.hostname;
    } catch {
      return false;
    }
  }, 'Enter a valid http or https URL.');
export const cadenceSchema = z.enum([
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'quarterly',
  'irregular',
]);
export const modeSchema = z.enum([
  'car',
  'bicycle',
  'walk',
  'train',
  'subway',
  'bus',
  'ferry',
]);
export const dietaryTags = [
  'Gluten-Free',
  'Vegan',
  'Vegetarian',
  'Nut Allergy',
  'Halal',
  'Keto',
  'Dairy-Free',
] as const;
export const activityTypes = [
  'Hike',
  'Bike ride',
  'Run',
  'Paddle',
  'Climb',
  'Park day',
] as const;
export const incomeSchema = z
  .object({
    name: short,
    amountCents: cents.refine((v) => v >= 0),
    cadence: cadenceSchema,
    nextDate: date,
  })
  .strict();
export const shiftSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    start: z.number().min(0).max(23.5),
    end: z.number().min(0.5).max(24),
  })
  .strict()
  .refine((v) => v.end > v.start);
export const profileSchema = z
  .object({
    completed: z.boolean(),
    receiptOcr: z.boolean().optional(),
    skipped: z.array(short).max(30),
    safetyBufferCents: cents.refine((v) => v >= 0).optional(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    pay: incomeSchema,
    streams: z.array(incomeSchema).max(20),
    savingsCents: cents,
    balanceDate: date.optional(),
    overdraft: z.boolean(),
    invoiceCents: cents.refine((v) => v >= 0),
    delayDays: z.number().int().min(0).max(180),
    lowMonthCents: cents.refine((v) => v >= 0),
    semiDays: z.tuple([
      z.number().int().min(1).max(28),
      z.number().int().min(1).max(28),
    ]),
    shifts: z.array(shiftSchema).max(21),
    modes: z.array(modeSchema).max(7),
    walkingMiles: z.number().min(0).max(5),
    distanceUnit: z.enum(['mi', 'km']),
    dietary: z.array(z.enum(dietaryTags)).max(7),
    feeds: z.array(short).max(50),
    activities: z.array(z.enum(activityTypes)).max(6),
    petEnabled: z.boolean(),
    petName: short,
    petSpecies: short,
    petBirthdate: date.nullable(),
    resetDay: z.number().int().min(0).max(6),
    distanceTolerance: z.number().positive().max(100),
    elevationTolerance: z.number().positive().max(20000),
  })
  .strict()
  .refine((p) => p.savingsCents >= 0 || p.overdraft, {
    message: 'Enable overdraft before entering negative savings.',
    path: ['savingsCents'],
  });
export type Profile = z.infer<typeof profileSchema>;
export type Income = z.infer<typeof incomeSchema>;
export type Mode = z.infer<typeof modeSchema>;
export function defaultProfile(today: string): Profile {
  return {
    completed: false,
    receiptOcr: false,
    skipped: [],
    currency: 'USD',
    pay: {
      name: 'Primary income',
      amountCents: 0,
      cadence: 'biweekly',
      nextDate: today,
    },
    streams: [],
    savingsCents: 0,
    balanceDate: today,
    overdraft: false,
    invoiceCents: 0,
    delayDays: 30,
    lowMonthCents: 0,
    semiDays: [1, 15],
    shifts: [1, 2, 3, 4, 5].map((day) => ({ day, start: 9, end: 17 })),
    modes: ['walk'],
    walkingMiles: 1.5,
    distanceUnit: 'mi',
    dietary: [],
    feeds: [],
    activities: [],
    petEnabled: false,
    petName: '',
    petSpecies: '',
    petBirthdate: null,
    resetDay: 0,
    distanceTolerance: 8,
    elevationTolerance: 2000,
  };
}
export const microSchema = z
  .object({
    id: short,
    title: short.min(1),
    minutes: z.number().int().min(5).max(480),
    done: z.boolean(),
    date: date.nullable(),
  })
  .strict();
export const resourceSchema = z
  .object({ title: short, url, file: short.optional() })
  .strict();
export const taskDetailSchema = z
  .object({
    role: z.enum(['student', 'professional', 'personal']),
    deadline: date.nullable(),
    resources: z.array(resourceSchema).max(50),
    rubric: text,
    conversation: text,
    micro: z.array(microSchema).max(100),
    lastDrawer: z
      .enum(['resources', 'rubric', 'conversation', 'notes'])
      .nullable(),
  })
  .strict();
export type TaskDetails = z.infer<typeof taskDetailSchema>;
export const ingredientSchema = z
  .object({
    name: short.min(1),
    quantity: z.number().min(0).max(100000),
    unit: short,
    section: short,
    restrictions: z.array(z.enum(dietaryTags)).max(7),
  })
  .strict();
export const recipeDetailSchema = z
  .object({
    servings: z.number().positive().max(100),
    ingredients: z.array(ingredientSchema).max(200),
    instructions: text,
    source: url,
    verified: z.array(z.enum(dietaryTags)).max(7),
  })
  .strict();
export type Ingredient = z.infer<typeof ingredientSchema>;
export function emptyTaskDetails(): TaskDetails {
  return {
    role: 'personal',
    deadline: null,
    resources: [],
    rubric: '',
    conversation: '',
    micro: [],
    lastDrawer: null,
  };
}
