import { useState } from 'react';
import { emptyTaskDetails } from '../../domain/product/model';
import { workspace } from '../local/runtime';
import { Page, Panel, Field } from './Common';
import { useProduct, run } from './state';
import type { UserRecord } from '../../domain/records';
import { TaskCard } from './TaskCard';
import s from './product.module.css';
type Task = Extract<UserRecord, { kind: 'task' }>;
export function TasksPage() {
  const { records } = useProduct();
  const [title, setTitle] = useState(''),
    [sampleAi, setSampleAi] = useState(false);
  const tasks = records.filter(
    (r): r is Task => r.kind === 'task' && !r.deletedAt,
  );
  return (
    <Page
      title="Tasks & small steps"
      subtitle="A workspace for each deliverable. Keep its context together and turn it into an approved plan."
    >
      <div className={s.actions}>
        <Field label="New task title">
          <input
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <button
          type="button"
          className={s.primary}
          disabled={!title.trim()}
          onClick={() =>
            run(
              workspace
                .save({
                  ...workspace.draft('task'),
                  title,
                  details: emptyTaskDetails(),
                })
                .then(() => setTitle('')),
            )
          }
        >
          Create task
        </button>
        <label>
          <input
            type="checkbox"
            checked={sampleAi}
            onChange={(e) => setSampleAi(e.target.checked)}
          />
          Use Sample AI provider
        </label>
      </div>
      <div className={s.stack}>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} sampleAi={sampleAi} />
        ))}
        {!tasks.length && (
          <Panel title="Your next small step">
            <p className={s.empty}>
              Create a task to keep its deadline, sources, notes, and plan
              together.
            </p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
