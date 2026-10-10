import { useState } from 'react';
import { personalizedReading } from '../../domain/product/reading-preferences';
import { addDays } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { useProduct, entities, run } from './state';
import s from './product.module.css';
export function ReadingPage() {
  const { today, profile } = useProduct();
  const [title, setTitle] = useState(''),
    [url, setUrl] = useState(''),
    [source, setSource] = useState(''),
    [minutes, setMinutes] = useState(4),
    [error, setError] = useState('');
  const articles = entities('news');
  const importRss = async (f: File) => {
    try {
      if (f.size > 1024 * 1024)
        throw new Error('Choose an RSS file under 1 MB.');
      const xml = new DOMParser().parseFromString(
        await f.text(),
        'application/xml',
      );
      if (xml.querySelector('parsererror'))
        throw new Error('This is not valid RSS or Atom.');
      const items = [...xml.querySelectorAll('item,entry')]
        .slice(0, 100)
        .map((item) => {
          const title =
              item.querySelector('title')?.textContent?.slice(0, 300) ??
              'Untitled article',
            link =
              item.querySelector('link')?.textContent?.trim() ||
              item.querySelector('link')?.getAttribute('href') ||
              '';
          return workspace.make(title, {
            type: 'news',
            source:
              source ||
              xml
                .querySelector('channel > title,feed > title')
                ?.textContent?.slice(0, 300) ||
              f.name,
            url: link,
            date: (() => {
              const raw = item.querySelector(
                'pubDate,published,updated',
              )?.textContent;
              const d = raw ? new Date(raw) : null;
              return d && Number.isFinite(d.getTime())
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                : today;
            })(),
            minutes: 4,
            read: false,
            muted: false,
            pausedUntil: null,
          });
        });
      await workspace.commit('Reading feed imported', items);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The feed could not be imported.',
      );
    }
  };
  return (
    <Page
      title="Reading & research"
      subtitle="A quiet feed ranked by your sources, topics, recency, and reading history. Saved messages live in Notes."
    >
      <div className={s.grid}>
        <Panel title="Your reading queue" wide>
          <p className={s.muted}>
            Digest review time: {profile.digestTime ?? '07:00'}. Sources and
            topics prioritize your imported reading.
          </p>
          {personalizedReading(articles, today, profile).map((n) => (
            <div className={s.row} key={n.id}>
              <div>
                <a
                  href={n.data.url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {n.title}
                </a>
                <p className={s.muted}>
                  {n.data.source} · {n.data.minutes} min read · {n.data.date}
                  {n.data.read ? ' · Read' : ''}
                </p>
              </div>
              <div className={s.actions}>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.save({
                        ...n,
                        data: { ...n.data, read: !n.data.read },
                      }),
                    )
                  }
                >
                  {n.data.read ? 'Mark unread' : 'Mark read'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.commit(
                        'Source paused',
                        articles
                          .filter((a) => a.data.source === n.data.source)
                          .map((a) => ({
                            ...a,
                            data: {
                              ...a.data,
                              pausedUntil: addDays(today, 7),
                            },
                          })),
                      ),
                    )
                  }
                >
                  Pause source 1 week
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.commit(
                        'Source muted',
                        articles
                          .filter((a) => a.data.source === n.data.source)
                          .map((a) => ({
                            ...a,
                            data: { ...a.data, muted: true },
                          })),
                      ),
                    )
                  }
                >
                  Mute source
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.commit(
                        'Source removed',
                        articles
                          .filter((a) => a.data.source === n.data.source)
                          .map((a) => ({
                            ...a,
                            deletedAt: workspace.clock.now().toISOString(),
                          })),
                      ),
                    )
                  }
                >
                  Remove source
                </button>
                <DeleteRecord record={n} />
              </div>
            </div>
          ))}
          {!articles.length && (
            <p className={s.empty}>
              Add an article link or import an RSS file to start a local reading
              queue.
            </p>
          )}
        </Panel>
        <Panel title="Add reading">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                workspace
                  .save(
                    workspace.make(title, {
                      type: 'news',
                      source,
                      url,
                      date: today,
                      minutes,
                      read: false,
                      muted: false,
                      pausedUntil: null,
                    }),
                  )
                  .then(() => {
                    setTitle('');
                    setUrl('');
                  }),
              );
            }}
          >
            <Field label="Article title">
              <input
                value={title}
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Article URL">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
            <Field label="Publication">
              <input
                value={source}
                list="followed-sources"
                maxLength={300}
                onChange={(e) => setSource(e.target.value)}
              />
              <datalist id="followed-sources">
                {profile.feeds.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </datalist>
            </Field>
            <Field label="Estimated reading minutes">
              <input
                type="number"
                min="1"
                max="120"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
            <button
              type="submit"
              className={s.primary}
              disabled={!title.trim()}
            >
              Save article
            </button>
            <Field label="Import RSS or Atom">
              <input
                type="file"
                accept=".xml,.rss,.atom"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importRss(f);
                  e.target.value = '';
                }}
              />
            </Field>
            {error && <p role="alert">{error}</p>}
          </form>
        </Panel>
        <Panel title="Paused or muted sources">
          {articles
            .filter(
              (n) =>
                n.data.muted ||
                (n.data.pausedUntil && n.data.pausedUntil > today),
            )
            .map((n) => (
              <div className={s.row} key={n.id}>
                <span>
                  {n.data.source} · {n.title}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      workspace.save({
                        ...n,
                        data: { ...n.data, muted: false, pausedUntil: null },
                      }),
                    )
                  }
                >
                  Restore
                </button>
              </div>
            ))}
        </Panel>
      </div>
    </Page>
  );
}
