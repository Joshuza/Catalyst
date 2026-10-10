import { Pantry } from './Pantry';
import { useState } from 'react';
import {
  dietaryCheck,
  parseIngredient,
  scaleIngredients,
  groceryDemand,
  ingredientAllowed,
} from '../../domain/product/food';
import { personalSlot } from '../../domain/product/schedule';
import { dietaryTags, type Ingredient } from '../../domain/product/model';
import { recordSchema, type UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord, ToggleSet } from './Common';
import { useProduct, entities, run, navigate } from './state';
import s from './product.module.css';
type Recipe = Extract<UserRecord, { kind: 'recipe' }>;
export function FoodPage() {
  const { records, profile, today } = useProduct();
  const [title, setTitle] = useState(''),
    [text, setText] = useState(''),
    [servings, setServings] = useState(4),
    [source, setSource] = useState(''),
    [instructions, setInstructions] = useState(''),
    [verified, setVerified] = useState<string[]>([]),
    [selected, setSelected] = useState<Recipe | null>(null),
    [target, setTarget] = useState(4),
    [error, setError] = useState('');
  const recipes = records.filter(
    (r): r is Recipe =>
      r.kind === 'recipe' &&
      !r.deletedAt &&
      dietaryCheck(r, profile.dietary).allowed,
  );
  const save = async () => {
    try {
      const base = workspace.draft('note');
      const { body: discard, ...metadata } = base;
      void discard;
      const ingredients = text
        .split('\n')
        .filter((l) => l.trim())
        .map(parseIngredient);
      const recipe = recordSchema.parse({
        ...metadata,
        kind: 'recipe',
        title,
        ingredients: ingredients.map((i) => i.name),
        details: { servings, ingredients, instructions, source, verified },
      });
      await workspace.save(recipe);
      setTitle('');
      setText('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check the recipe values.');
    }
  };
  const ingredients: Ingredient[] = selected?.details
    ? scaleIngredients(
        selected.details.ingredients,
        selected.details.servings,
        target,
      )
    : (selected?.ingredients.map(parseIngredient) ?? []);
  const addGroceries = async () => {
    const current = entities('grocery').filter((g) => !g.data.checked);
    const missing = groceryDemand(
      ingredients,
      current.map((g) => g.data),
      entities('pantry').map((p) => p.data),
    );
    await workspace.commit(
      'Recipe added to groceries',
      missing.map((i) => {
        const existing = current.find(
          (g) => g.data.name === i.name && g.data.unit === i.unit,
        );
        return existing
          ? {
              ...existing,
              data: {
                ...existing.data,
                quantity: i.quantity,
                requiredQuantity: i.requiredQuantity,
              },
            }
          : workspace.make(i.name, {
              type: 'grocery',
              name: i.name,
              requiredQuantity: i.requiredQuantity,
              quantity: i.quantity,
              unit: i.unit,
              section: i.section,
              checked: false,
              tripId: null,
            });
      }),
    );
  };
  const groceries = entities('grocery')
    .map((g) => {
      const demand = !g.data.checked
        ? groceryDemand(
            [],
            [g.data],
            entities('pantry').map((p) => p.data),
          )[0]
        : undefined;
      return {
        ...g,
        data: {
          ...g.data,
          ...(demand
            ? {
                quantity: demand.quantity,
                requiredQuantity: demand.requiredQuantity,
              }
            : {}),
        },
      };
    })
    .filter(
      (g) =>
        g.data.quantity > 0 && ingredientAllowed(g.data.name, profile.dietary),
    );
  return (
    <Page
      title="Recipes & groceries"
      subtitle="Scale a meal, check the pantry, and buy only what is missing. Dietary restrictions are hard filters."
    >
      <div className={s.grid}>
        <Panel title="Recipe library">
          {recipes.map((r) => (
            <div className={s.row} key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(r);
                  setTarget(r.details?.servings ?? 4);
                }}
              >
                {r.title}
              </button>
              <p className={s.muted}>
                {dietaryCheck(r, profile.dietary)
                  .unverified.map((tag) => `Not verified for ${tag}`)
                  .join(' · ')}
              </p>
              <DeleteRecord record={r} />
            </div>
          ))}
          {!recipes.length && (
            <p className={s.empty}>
              Add a recipe below. Recipes conflicting with your dietary profile
              are hidden.
            </p>
          )}
          <details>
            <summary>Import or write a recipe</summary>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <Field label="Recipe title">
                <input
                  value={title}
                  maxLength={300}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Recipe link">
                <input
                  type="url"
                  value={source}
                  placeholder="Optional source URL"
                  onChange={(e) => setSource(e.target.value)}
                />
              </Field>
              <p className={s.muted}>
                Link imports use manual entry: paste the ingredients and
                instructions from the source.
              </p>
              <Field label="Base servings">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                />
              </Field>
              <Field label="Ingredients, one per line">
                <textarea
                  value={text}
                  placeholder="200 g rice"
                  onChange={(e) => setText(e.target.value)}
                />
              </Field>
              <Field label="Cooking instructions">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </Field>
              <ToggleSet
                label="Dietary tags you have verified"
                options={[...dietaryTags]}
                values={verified}
                onChange={setVerified}
              />
              <button
                type="submit"
                className={s.primary}
                disabled={!title.trim() || !text.trim()}
              >
                Save recipe
              </button>
              {error && <p role="alert">{error}</p>}
            </form>
          </details>
        </Panel>
        <Panel title={selected?.title ?? 'Meal details'}>
          {selected ? (
            <>
              <Field label="Scale to servings">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={target}
                  onChange={(e) =>
                    setTarget(Math.max(1, Number(e.target.value)))
                  }
                />
              </Field>
              <ul>
                {ingredients.map((i, index) => (
                  <li key={index}>
                    {i.quantity.toFixed(1)} {i.unit} {i.name}
                  </li>
                ))}
              </ul>
              <p className={s.note}>{selected.details?.instructions}</p>
              <div className={s.actions}>
                <button
                  type="button"
                  className={s.primary}
                  onClick={() => run(addGroceries())}
                >
                  Add to Grocery List
                </button>
                <button type="button" onClick={() => navigate('transit')}>
                  Plan a shopping route
                </button>
              </div>
            </>
          ) : (
            <p className={s.empty}>
              Select a recipe to scale its ingredients and check what is
              missing.
            </p>
          )}
        </Panel>
        <Panel title="Smart grocery list">
          {[...new Set(groceries.map((g) => g.data.section))].map((section) => (
            <div key={section}>
              <h3>{section}</h3>
              {groceries
                .filter((g) => g.data.section === section)
                .map((g) => (
                  <div className={s.row} key={g.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={g.data.checked}
                        onChange={(e) =>
                          run(
                            workspace.save({
                              ...g,
                              data: { ...g.data, checked: e.target.checked },
                            }),
                          )
                        }
                      />
                      {g.data.quantity} {g.data.unit} {g.data.name}
                    </label>
                    <DeleteRecord record={g} />
                  </div>
                ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const slot = personalSlot(
                profile,
                today,
                entities('event').map((e) => e.data),
              );
              if (!slot) {
                setError(
                  'No free time outside protected hours. Choose a shopping time in Calendar.',
                );
                return;
              }
              const event = workspace.make('Grocery shopping', {
                type: 'event',
                ...slot,
                category: 'personal',
                taskId: null,
                travelMinutes: 0,
                location: '',
                ticket: 'none',
                reference: '',
              });
              run(
                workspace.commit('Shopping trip planned', [
                  event,
                  ...groceries
                    .filter((g) => !g.data.checked)
                    .map((g) => ({
                      ...g,
                      data: { ...g.data, tripId: event.id },
                    })),
                ]),
              );
            }}
          >
            Schedule shopping trip outside core hours
          </button>
        </Panel>
        <Pantry />
      </div>
    </Page>
  );
}
