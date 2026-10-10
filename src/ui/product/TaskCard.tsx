import { useState } from 'react';
import { emptyTaskDetails, type TaskDetails } from '../../domain/product/model';
import { workingHours, planSteps } from '../../domain/product/schedule';
import { addDays } from '../../domain/product/dates';
import { taskPrompt, validateProposal } from '../../domain/product/tasks';
import { providers } from '../../engine/product/providers';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { TaskSettings } from './TaskSettings';
import { Field } from './Common';
import { useProduct, entities, run } from './state';
import { PlanEditor } from './PlanEditor';
import s from './product.module.css';
type Task = Extract<UserRecord, { kind: 'task' }>;
export function TaskCard({
  task,
  sampleAi,
}: {
  task: Task;
  sampleAi: boolean;
}) {
  const { profile, today } = useProduct();
  const details = task.details ?? emptyTaskDetails();
  const [drawer, setDrawer] = useState(details.lastDrawer),
    [notes, setNotes] = useState(task.notes),
    [rubric, setRubric] = useState(details.rubric),
    [conversation, setConversation] = useState(details.conversation),
    [resourceTitle, setResourceTitle] = useState(''),
    [url, setUrl] = useState(''),
    [proposal, setProposal] = useState<
      { title: string; minutes: number }[] | null
    >(null),
    [json, setJson] = useState(''),
    [error, setError] = useState(''),
    [sent, setSent] = useState('');
  const events = entities('event').map((e) => e.data);
  const hours = details.deadline
    ? workingHours(
        profile,
        today,
        details.deadline,
        events,
        workspace.clock.now().getHours() +
          workspace.clock.now().getMinutes() / 60,
      )
    : null;
  const done = details.micro.filter((m) => m.done).length;
  const progress = details.micro.length
    ? Math.round((done / details.micro.length) * 100)
    : task.completed
      ? 100
      : 0;
  const update = (patch: Partial<TaskDetails>) =>
    workspace.save({ ...task, details: { ...details, ...patch } });
  const context = {
    title: task.title,
    details,
    notes: task.notes,
    workingWeek: profile.shifts,
  };
  const approve = async () => {
    try {
      if (!proposal) return;
      const end = details.deadline ?? addDays(today, 14);
      const validated = validateProposal(proposal);
      const slots = planSteps(
        profile,
        today,
        end,
        validated,
        events,
        workspace.clock.now().getHours() +
          workspace.clock.now().getMinutes() / 60,
      );
      if (!slots)
        throw new Error(
          'This plan does not fit before the deadline. Shorten steps or move the deadline.',
        );
      const micro = proposal.map((p, i) => ({
        id: `${task.id}-${i}-${workspace.clock.now().getTime()}`,
        title: p.title,
        minutes: p.minutes,
        done: false,
        date: slots[i]!.date,
      }));
      const planned = proposal.map((p, i) =>
        workspace.make(`${task.title}: ${p.title}`, {
          type: 'event',
          ...slots[i]!,
          category: 'work',
          taskId: task.id,
          travelMinutes: 0,
          location: '',
          ticket: 'none',
          reference: '',
        }),
      );
      await workspace.commit('Task plan approved', [
        {
          ...task,
          details: { ...details, micro: [...details.micro, ...micro] },
        },
        ...planned,
      ]);
      setProposal(null);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The plan could not be scheduled.',
      );
    }
  };
  return (
    <article className={s.panel} aria-label={`Task ${task.title}`}>
      <div className={s.row}>
        <div>
          <h2>{task.title}</h2>
          <p
            className={s.muted}
            data-urgency={
              (hours ?? 100) < 8
                ? 'urgent'
                : (hours ?? 100) < 24
                  ? 'soon'
                  : 'calm'
            }
          >
            {details.deadline
              ? `${details.deadline} · ${hours?.toFixed(1)} available working hours${(hours ?? 0) < 8 ? ' · urgent' : (hours ?? 0) < 24 ? ' · soon' : ''}`
              : 'No deadline set'}{' '}
            · {done} of {details.micro.length} steps complete
          </p>
        </div>
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) =>
              run(workspace.save({ ...task, completed: e.target.checked }))
            }
          />
          Complete
        </label>
      </div>
      <progress className={s.progress} max="100" value={progress} />
      <p className={s.muted}>{progress}% complete</p>
      <div className={s.actions}>
        {(['resources', 'rubric', 'conversation', 'notes'] as const).map(
          (v) => (
            <button
              type="button"
              key={v}
              aria-expanded={drawer === v}
              onClick={() => {
                const next = drawer === v ? null : v;
                setDrawer(next);
                run(update({ lastDrawer: next }));
              }}
            >
              {v}
            </button>
          ),
        )}
        <button
          type="button"
          className={s.primary}
          onClick={() => {
            setError('');
            void (sampleAi ? providers().sampleAi : providers().manualAi)
              .propose(context)
              .then((plan) => {
                setSent(
                  sampleAi
                    ? `Sample provider received only “${task.title}”: its rubric, notes, links, conversation, deadline, and working shifts.`
                    : 'No information was sent. Copy the prompt to your AI account or enter steps manually.',
                );
                if (plan) setProposal(validateProposal(plan));
                else setProposal([]);
              })
              .catch((err) =>
                setError(
                  err instanceof Error
                    ? err.message
                    : 'The provider response was invalid.',
                ),
              );
          }}
        >
          Small Steps
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              .writeText(taskPrompt(context))
              .then(() => setSent('Prompt copied. Only this task is included.'))
              .catch(() => {
                setJson(taskPrompt(context));
                setSent('Copy is unavailable. Select the prompt text below.');
              });
          }}
        >
          Copy AI prompt
        </button>
      </div>
      <TaskSettings task={task} details={details} update={update} />
      {drawer === 'notes' && (
        <Field label="Task notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() =>
              notes !== task.notes && run(workspace.save({ ...task, notes }))
            }
          />
        </Field>
      )}
      {drawer === 'rubric' && (
        <Field label="Rubric or requirements">
          <textarea
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            onBlur={() => rubric !== details.rubric && run(update({ rubric }))}
          />
        </Field>
      )}
      {drawer === 'conversation' && (
        <Field label="Conversation context">
          <textarea
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
            onBlur={() =>
              conversation !== details.conversation &&
              run(update({ conversation }))
            }
          />
        </Field>
      )}
      {drawer === 'resources' && (
        <div className={s.form}>
          {details.resources.map((r, i) => (
            <div className={s.row} key={i}>
              <a
                href={r.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {r.title}
              </a>
              <button
                type="button"
                onClick={() =>
                  run(
                    update({
                      resources: details.resources.filter((_, j) => j !== i),
                    }),
                  )
                }
              >
                Remove resource
              </button>
            </div>
          ))}
          <Field label="Resource title">
            <input
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
            />
          </Field>
          <Field label="Resource URL">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <button
            type="button"
            disabled={!resourceTitle.trim()}
            onClick={() =>
              run(
                update({
                  resources: [
                    ...details.resources,
                    { title: resourceTitle, url },
                  ],
                }).then(() => {
                  setResourceTitle('');
                  setUrl('');
                }),
              )
            }
          >
            Add resource
          </button>
          <Field label="Assignment file">
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f || f.size > 20 * 1024 * 1024) {
                  setError('Choose a file under 20 MB.');
                  return;
                }
                void providers()
                  .documents.read(f)
                  .then(async (text) => {
                    const rubric = (details.rubric + '\n' + text).slice(
                      0,
                      20000,
                    );
                    await update({
                      rubric,
                      resources: [
                        ...details.resources,
                        { title: f.name, url: '', file: f.name },
                      ],
                    });
                    setRubric(rubric);
                    setError('');
                  })
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'The document could not be read.',
                    ),
                  );
                e.target.value = '';
              }}
            />
          </Field>
        </div>
      )}
      {details.micro.length > 0 && (
        <details>
          <summary>Steps & completion</summary>
          {details.micro.map((m, i) => (
            <div className={s.row} key={m.id}>
              <label>
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={(e) =>
                    run(
                      update({
                        micro: details.micro.map((v, j) =>
                          j === i ? { ...v, done: e.target.checked } : v,
                        ),
                      }),
                    )
                  }
                />
                {m.title}
              </label>
              <span className={s.muted}>
                {m.minutes} min · {m.date ?? 'Unscheduled'}
              </span>
            </div>
          ))}
        </details>
      )}
      {sent && <p className={s.alert}>{sent}</p>}
      {json && (
        <Field label="Generated AI prompt">
          <textarea readOnly value={json} />
        </Field>
      )}
      {proposal !== null && (
        <PlanEditor
          proposal={proposal}
          setProposal={setProposal}
          sampleAi={sampleAi}
          onApprove={approve}
          onError={setError}
        />
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}
