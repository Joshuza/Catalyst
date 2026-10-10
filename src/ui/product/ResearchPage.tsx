import { useState } from 'react';
import { semanticTags, safeImage } from '../../domain/product/evolution';
import { addDays } from '../../domain/product/dates';
import type { DataOf } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, MoneyField, DeleteRecord } from './Common';
import { useProduct, entities, money } from './state';
import { ResearchDetails } from './ResearchDetails';
import { ReceiptPrinter } from './Animations';
import s from './product.module.css';
export function ResearchPage() {
  const { today, busy } = useProduct();
  const [title, setTitle] = useState(''),
    [url, setUrl] = useState(''),
    [body, setBody] = useState(''),
    [pros, setPros] = useState(''),
    [cons, setCons] = useState(''),
    [image, setImage] = useState(''),
    [tags, setTags] = useState(''),
    [cost, setCost] = useState(0),
    [priority, setPriority] =
      useState<DataOf<'research'>['priority']>('Researching'),
    [query, setQuery] = useState(''),
    [date, setDate] = useState(addDays(today, 7)),
    [error, setError] = useState(''),
    [printed, setPrinted] = useState<{ title: string; cents: number } | null>(
      null,
    );
  const cards = entities('research').filter((r) =>
    `${r.title} ${r.data.tags.join(' ')} ${r.data.body}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  async function readImage(file: File) {
    try {
      if (
        file.size > 2 * 1024 * 1024 ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      )
        throw new Error('Choose PNG, JPEG, or WebP under 2 MB.');
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Image could not be read.'));
        reader.readAsDataURL(file);
      });
      if (!safeImage(result)) throw new Error('Unsupported image.');
      setImage(result);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image could not be added.');
    }
  }
  async function save() {
    try {
      await workspace.save(
        workspace.make(title, {
          type: 'research',
          url,
          body,
          image,
          tags: tags.trim()
            ? tags
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
            : semanticTags(title, body),
          priority,
          pros,
          cons,
          costCents: cost,
          purchaseId: null,
        }),
      );
      setTitle('');
      setBody('');
      setUrl('');
      setImage('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Research could not be saved.');
    }
  }
  const plan = async (id: string) => {
    try {
      const r = entities('research').find((r) => r.id === id);
      if (!r || r.data.purchaseId) return;
      if (r.data.costCents <= 0)
        throw new Error(
          'Enter a positive estimated cost on this research card first.',
        );
      const purchase = workspace.make(r.title, {
        type: 'purchase',
        costCents: r.data.costCents,
        date,
        status: 'planned',
        scenario: 'Main',
        actualCents: null,
        regret: null,
        emotion: null,
        transactionId: null,
      });
      await workspace.commit('Research purchase planned', [
        purchase,
        { ...r, data: { ...r.data, purchaseId: purchase.id } },
      ]);
      setPrinted({ title: r.title, cents: r.data.costCents });
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Purchase could not be planned.',
      );
    }
  };
  return (
    <Page
      title="Research vault"
      subtitle="Keep ideas, images, quotes, and product links together. Local keyword tags help you find them again."
    >
      <div className={s.grid}>
        <Panel title="Your saved ideas" wide>
          <div className={s.pair}>
            <Field label="Filter research">
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </Field>
            <Field label="Plan purchases for">
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <div className={s.grid}>
            {cards.map((r) => (
              <article
                key={r.id}
                className={s.panel}
                draggable={!r.data.purchaseId}
                onDragStart={(e) =>
                  e.dataTransfer.setData('application/x-nexus-research', r.id)
                }
                aria-label={`Research ${r.title}`}
              >
                {r.data.image && safeImage(r.data.image) && (
                  <img
                    src={r.data.image}
                    alt={r.title}
                    className={s.researchImage}
                  />
                )}
                <h3>{r.title}</h3>
                <span className={s.badge}>{r.data.priority}</span>
                <p>{r.data.body}</p>
                <p className={s.muted}>{r.data.tags.join(' · ')}</p>
                {r.data.url && (
                  <a
                    href={r.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open source
                  </a>
                )}
                <ResearchDetails record={r} />
                <div className={s.actions}>
                  <button
                    type="button"
                    disabled={
                      busy || !!r.data.purchaseId || r.data.costCents <= 0
                    }
                    onClick={() => void plan(r.id)}
                  >
                    {r.data.purchaseId
                      ? 'Linked to your cart'
                      : `Plan purchase ${money(r.data.costCents)}`}
                  </button>
                  <DeleteRecord record={r} />
                </div>
              </article>
            ))}
          </div>
          {!cards.length && (
            <p className={s.empty}>
              Save your first idea below to build a searchable visual
              collection.
            </p>
          )}
          <div
            className={s.dropTarget}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('application/x-nexus-research'))
                e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              void plan(e.dataTransfer.getData('application/x-nexus-research'));
            }}
          >
            Drop a research card here to plan its purchase. The Plan purchase
            button also works by keyboard.
          </div>
          {printed && (
            <ReceiptPrinter key={printed.title} {...printed} planned />
          )}
          {error && <p role="alert">{error}</p>}
        </Panel>
        <Panel title="Capture an idea">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Research title">
              <input
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Source link">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
            <Field label="Idea, quote or notes">
              <textarea
                maxLength={20000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <Field label="Pros">
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
            </Field>
            <Field label="Cons">
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                {['Researching', 'Nice to have', 'Must have'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <MoneyField
              label="Research estimated cost"
              cents={cost}
              onChange={setCost}
            />
            <Field label="Tags separated by commas">
              <input value={tags} onChange={(e) => setTags(e.target.value)} />
              <span className={s.muted}>
                Leave blank for local keyword tags. No image recognition or
                website scraping is connected.
              </span>
            </Field>
            <Field label="Research image">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readImage(f);
                }}
              />
            </Field>
            <button className={s.primary} disabled={busy}>
              Save research
            </button>
          </form>
        </Panel>
      </div>
    </Page>
  );
}
