import { useState } from 'react';
import type { DataOf } from '../../domain/product/model';
import { semanticTags } from '../../domain/product/evolution';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run } from './state';
import s from './product.module.css';
export function AudioPage() {
  const { deep, busy } = useProduct();
  const [context, setContext] = useState<DataOf<'audio'>['context']>(
      deep ? 'Deep work' : 'Any',
    ),
    [title, setTitle] = useState(''),
    [url, setUrl] = useState(''),
    [tags, setTags] = useState(''),
    [category, setCategory] = useState<DataOf<'audio'>['category']>('Podcast'),
    [minutes, setMinutes] = useState(30),
    [match, setMatch] = useState<DataOf<'audio'>['context']>('Any');
  const interests = new Set(entities('research').flatMap((r) => r.data.tags));
  const picks = entities('audio')
    .filter(
      (a) =>
        context === 'Any' ||
        a.data.context === 'Any' ||
        a.data.context === context,
    )
    .sort(
      (a, b) =>
        b.data.tags.filter((t) => interests.has(t)).length -
          a.data.tags.filter((t) => interests.has(t)).length ||
        Number(a.data.played) - Number(b.data.played),
    );
  return (
    <Page
      title="Listen"
      subtitle="Choose podcasts and music for your current activity. Matches use your saved interests locally; streaming accounts are not connected."
    >
      <div className={s.grid}>
        <Panel title="For this moment" wide>
          <Field label="Listening context">
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as typeof context)}
            >
              {['Any', 'Deep work', 'Chores', 'Commute'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          {picks.map((a) => (
            <div className={s.row} key={a.id}>
              <div>
                <h3>
                  <a
                    href={a.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {a.title}
                  </a>
                </h3>
                <p>
                  {a.data.category} · {a.data.context} · {a.data.minutes}{' '}
                  minutes
                  {a.data.tags.some((t) => interests.has(t))
                    ? ' · Matches your research interests'
                    : ''}
                </p>
                <span className={s.muted}>{a.data.tags.join(' · ')}</span>
              </div>
              <div className={s.actions}>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.save({
                        ...a,
                        data: { ...a.data, played: !a.data.played },
                      }),
                    )
                  }
                >
                  {a.data.played ? 'Mark unplayed' : 'Mark played'}
                </button>
                <DeleteRecord record={a} />
              </div>
            </div>
          ))}
          {!picks.length && (
            <p className={s.empty}>
              Save a podcast or playlist link below to build your own listening
              collection.
            </p>
          )}
        </Panel>
        <Panel title="Save audio">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(title, {
                      type: 'audio',
                      url,
                      category,
                      context: match,
                      minutes,
                      tags: tags
                        ? tags
                            .split(',')
                            .map((t) => t.trim().toLowerCase())
                            .filter(Boolean)
                        : semanticTags(title, ''),
                      played: false,
                    }),
                  )
                  .then(() => setTitle('')),
              );
            }}
          >
            <Field label="Audio title">
              <input
                required
                value={title}
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Audio link">
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
            <Field label="Audio type">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                <option>Podcast</option>
                <option>Music</option>
              </select>
            </Field>
            <Field label="Best for">
              <select
                value={match}
                onChange={(e) => setMatch(e.target.value as typeof match)}
              >
                {['Any', 'Deep work', 'Chores', 'Commute'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Audio minutes">
              <input
                type="number"
                min="1"
                max="1440"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
            <Field label="Audio topics">
              <input value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <button className={s.primary} disabled={busy}>
              Save audio
            </button>
          </form>
        </Panel>
      </div>
    </Page>
  );
}
