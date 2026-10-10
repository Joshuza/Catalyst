import type { Profile } from '../../domain/product/model';
import { Field, ToggleSet } from './Common';
import s from './product.module.css';
import { useState } from 'react';
import { providers } from '../../engine/product/providers';
import { dietaryTags, activityTypes } from '../../domain/product/model';
const sources = [
  'Substack',
  'NYT',
  'F1.com',
  'The Verge',
  'Vox',
  'BBC',
  'NPR',
  'Reuters',
  'The Guardian',
  'Financial Times',
  'Wired',
  'Ars Technica',
  'Nature',
  'Science',
  'The Atlantic',
  'The Economist',
  'AP',
  'Bloomberg',
  'MIT Technology Review',
  'National Geographic',
];
export function ProfileLifestyle({
  draft,
  patch,
  show,
}: {
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
  show: (i: number) => boolean;
}) {
  const [feed, setFeed] = useState(''),
    [error, setError] = useState('');
  return (
    <>
      {show(8) && (
        <ToggleSet
          label="Dietary restrictions and severe allergies"
          options={[...dietaryTags, 'None']}
          values={draft.dietary.length ? draft.dietary : ['None']}
          onChange={(v) =>
            patch({
              dietary: (v.includes('None') && draft.dietary.length > 0
                ? []
                : v.filter((t) => t !== 'None')) as Profile['dietary'],
            })
          }
        />
      )}
      {show(9) && (
        <>
          <ToggleSet
            label="Followed publications"
            options={sources}
            values={draft.feeds}
            onChange={(feeds) => patch({ feeds })}
          />
          <Field label="Publication name or link">
            <input
              value={feed}
              maxLength={300}
              onChange={(e) => setFeed(e.target.value)}
            />
          </Field>
          <button
            type="button"
            disabled={!feed.trim()}
            onClick={() => {
              void providers()
                .feeds.resolve(feed.trim())
                .then((result) => {
                  patch({ feeds: [...new Set([...draft.feeds, result.name])] });
                  setFeed('');
                })
                .catch((e) =>
                  setError(
                    e instanceof Error
                      ? e.message
                      : 'This source could not be resolved.',
                  ),
                );
            }}
          >
            Add source manually
          </button>
          {error && <p role="alert">{error}</p>}
          <p className={s.muted}>
            Sources resolve locally. Feed content is added as links or RSS files
            in Reading.
          </p>
        </>
      )}
      {show(10) && (
        <>
          <ToggleSet
            label="Outdoor activities"
            options={[...activityTypes]}
            values={draft.activities}
            onChange={(v) => patch({ activities: v as Profile['activities'] })}
          />
          <div className={s.pair}>
            <Field label="Distance tolerance in miles">
              <input
                type="number"
                min=".1"
                step=".1"
                max="100"
                value={draft.distanceTolerance}
                onChange={(e) =>
                  patch({ distanceTolerance: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Elevation tolerance in feet">
              <input
                type="number"
                min="1"
                max="20000"
                value={draft.elevationTolerance}
                onChange={(e) =>
                  patch({ elevationTolerance: Number(e.target.value) })
                }
              />
            </Field>
          </div>
        </>
      )}
      {show(11) && (
        <>
          <label>
            <input
              type="checkbox"
              role="switch"
              checked={draft.petEnabled}
              onChange={(e) => patch({ petEnabled: e.target.checked })}
            />
            Enable Pet Tracker
          </label>
          {draft.petEnabled && (
            <>
              <Field label="Pet name">
                <input
                  value={draft.petName}
                  onChange={(e) => patch({ petName: e.target.value })}
                />
              </Field>
              <Field label="Pet species">
                <input
                  value={draft.petSpecies}
                  onChange={(e) => patch({ petSpecies: e.target.value })}
                />
              </Field>
              <Field label="Vet visit interval in months">
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={draft.petVetMonths ?? 12}
                  onChange={(e) =>
                    patch({ petVetMonths: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Food restock interval in days">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={draft.petFoodDays ?? 30}
                  onChange={(e) =>
                    patch({ petFoodDays: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Next vet visit">
                <input
                  type="date"
                  value={draft.petNextVet ?? ''}
                  onChange={(e) =>
                    patch({ petNextVet: e.target.value || null })
                  }
                />
              </Field>
              <Field label="Next food restock">
                <input
                  type="date"
                  value={draft.petNextFood ?? ''}
                  onChange={(e) =>
                    patch({ petNextFood: e.target.value || null })
                  }
                />
              </Field>
              <Field label="Pet birthdate">
                <input
                  type="date"
                  value={draft.petBirthdate ?? ''}
                  onChange={(e) =>
                    patch({ petBirthdate: e.target.value || null })
                  }
                />
              </Field>
            </>
          )}
        </>
      )}
    </>
  );
}
