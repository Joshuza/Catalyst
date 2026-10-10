import type { Ingredient, Profile } from './model';
import type { UserRecord } from '../records';
const conflicts: Record<Profile['dietary'][number], RegExp> = {
  'Gluten-Free':
    /\b(wheat|barley|rye|flour|bread|pasta|couscous|semolina|malt|soy sauce|seitan)\b/i,
  'Nut Allergy':
    /\b(nut|nuts|almond|peanut|cashew|walnut|pecan|pistachio|hazelnut|pesto|marzipan|praline)\b/i,
  Vegan:
    /\b(beef|pork|chicken|fish|salmon|tuna|egg|eggs|milk|cheese|butter|cream|honey|yogurt|gelatin|whey|casein)\b/i,
  Vegetarian:
    /\b(beef|pork|chicken|fish|salmon|tuna|bacon|gelatin|lard|anchovy)\b/i,
  Halal: /\b(pork|bacon|ham|wine|beer|rum|vodka|lard)\b/i,
  Keto: /\b(sugar|rice|pasta|potato|bread|flour|honey)\b/i,
  'Dairy-Free': /\b(milk|cheese|butter|cream|yogurt|whey|casein|ghee)\b/i,
};
export function dietaryCheck(
  recipe: Extract<UserRecord, { kind: 'recipe' }>,
  tags: Profile['dietary'],
): { allowed: boolean; unverified: string[] } {
  const names =
    recipe.details?.ingredients.map((i) => i.name) ?? recipe.ingredients;
  const explicit =
    recipe.details?.ingredients.flatMap((i) => i.restrictions) ?? [];
  if (
    tags.some(
      (tag) =>
        explicit.includes(tag) ||
        names.some((name) => conflicts[tag].test(name)),
    )
  )
    return { allowed: false, unverified: [] };
  return {
    allowed: true,
    unverified: tags.filter((tag) => !recipe.details?.verified.includes(tag)),
  };
}
const conversions: Record<string, { unit: string; factor: number }> = {
  g: { unit: 'g', factor: 1 },
  gram: { unit: 'g', factor: 1 },
  grams: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  oz: { unit: 'g', factor: 28.3495 },
  lb: { unit: 'g', factor: 453.592 },
  ml: { unit: 'ml', factor: 1 },
  l: { unit: 'ml', factor: 1000 },
  cup: { unit: 'ml', factor: 236.588 },
  cups: { unit: 'ml', factor: 236.588 },
  tbsp: { unit: 'ml', factor: 14.7868 },
  tsp: { unit: 'ml', factor: 4.92892 },
};
export function normalizeIngredient(i: Ingredient): Ingredient {
  const c = conversions[i.unit.toLowerCase()];
  return {
    ...i,
    name: i.name.trim().toLowerCase(),
    quantity: i.quantity * (c?.factor ?? 1),
    unit: c?.unit ?? i.unit.toLowerCase(),
  };
}
export function parseIngredient(line: string): Ingredient {
  const m = /^\s*(?:(\d+)\s+)?(\d+\/\d+|\d+(?:\.\d+)?)\s+(.+)$/.exec(line);
  const raw = m?.[2] ?? '1',
    [a, b] = raw.split('/');
  const quantity = Number(m?.[1] ?? 0) + Number(a) / (b ? Number(b) : 1);
  if (!Number.isFinite(quantity) || quantity < 0)
    throw new Error('Check the ingredient quantity.');
  const remainder = m?.[3] ?? line.trim(),
    words = remainder.split(/\s+/),
    first = words[0]!.toLowerCase();
  const measured =
    Object.hasOwn(conversions, first) ||
    ['item', 'items', 'each', 'clove', 'cloves'].includes(first);
  const name = measured ? words.slice(1).join(' ') : remainder;
  const guessedUnit = measured ? first : 'item';
  const ingredient = {
    name,
    quantity,
    unit: guessedUnit,
    section: /rice|pasta|lentil|bean|flour/i.test(name)
      ? 'Pantry'
      : /milk|cheese|yogurt/i.test(name)
        ? 'Chilled'
        : 'Produce',
    restrictions: [],
  };
  return normalizeIngredient(ingredient);
}
export function scaleIngredients(
  items: Ingredient[],
  from: number,
  to: number,
): Ingredient[] {
  return items.map((i) => ({ ...i, quantity: (i.quantity * to) / from }));
}
export function missingIngredients(
  items: Ingredient[],
  pantry: { name: string; quantity: number; unit: string }[],
): Ingredient[] {
  const merged = new Map<string, Ingredient>();
  for (const raw of items) {
    const i = normalizeIngredient(raw),
      key = `${i.name}|${i.unit}`;
    const previous = merged.get(key);
    merged.set(key, { ...i, quantity: i.quantity + (previous?.quantity ?? 0) });
  }
  for (const raw of pantry) {
    const p = normalizeIngredient({ ...raw, section: '', restrictions: [] }),
      key = `${p.name}|${p.unit}`;
    const ingredient = merged.get(key);
    if (ingredient)
      ingredient.quantity = Math.max(0, ingredient.quantity - p.quantity);
  }
  return [...merged.values()]
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      ...i,
      quantity:
        i.unit === 'item'
          ? Math.ceil(i.quantity)
          : Math.ceil(i.quantity / 10) * 10,
    }));
}

export function ingredientAllowed(
  name: string,
  tags: Profile['dietary'],
): boolean {
  return !tags.some((tag) => conflicts[tag].test(name));
}
export function groceryDemand(
  incoming: Ingredient[],
  current: {
    name: string;
    unit: string;
    quantity: number;
    requiredQuantity?: number;
    section: string;
  }[],
  pantry: { name: string; unit: string; quantity: number }[],
) {
  const demands = new Map<string, Ingredient>();
  for (const raw of [
    ...current.map((g) => ({
      ...g,
      quantity: g.requiredQuantity ?? g.quantity,
      restrictions: [],
    })),
    ...incoming,
  ]) {
    const i = normalizeIngredient(raw),
      key = `${i.name}|${i.unit}`,
      prior = demands.get(key);
    demands.set(key, { ...i, quantity: i.quantity + (prior?.quantity ?? 0) });
  }
  return [...demands.values()].map((i) => {
    const missing = missingIngredients([i], pantry)[0];
    return {
      ...i,
      requiredQuantity: i.quantity,
      quantity: missing?.quantity ?? 0,
    };
  });
}
