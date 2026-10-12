import { useState } from 'react';
import { workspace } from '../local/runtime';
import { Modal } from '../local/Modal';
import { useProduct, entities, run, navigate, type Entity } from './state';
import { Field } from './Common';
import s from './product.module.css';
export function DashboardTools({
  customizing,
  toggle,
}: {
  customizing: boolean;
  toggle: () => void;
}) {
  return (
    <div className={s.briefingTools}>
      <button type="button" onClick={() => navigate('create')}>
        Add new <span aria-hidden="true">+</span>
      </button>
      <button type="button" aria-pressed={customizing} onClick={toggle}>
        {customizing ? 'Finish customizing' : 'Customize dashboard'}
      </button>
    </div>
  );
}
export function BriefingControls({
  id,
  expanded,
  toggle,
}: {
  id: string;
  expanded: boolean;
  toggle: () => void;
}) {
  const preferences = entities('briefing')[0],
    pinned = preferences?.data.pinned.includes(id);
  return (
    <div className={s.actions}>
      <button type="button" aria-expanded={expanded} onClick={toggle}>
        {expanded ? 'Less detail' : 'More detail'}
      </button>
      {preferences && (
        <>
          <button
            type="button"
            aria-pressed={pinned}
            onClick={() =>
              run(
                workspace.save({
                  ...preferences,
                  data: {
                    ...preferences.data,
                    pinned: pinned
                      ? preferences.data.pinned.filter((v) => v !== id)
                      : [...preferences.data.pinned, id],
                  },
                }),
              )
            }
          >
            {pinned ? 'Unpin section' : 'Pin section'}
          </button>
          <button
            type="button"
            disabled={pinned}
            onClick={() =>
              run(
                workspace.save({
                  ...preferences,
                  data: {
                    ...preferences.data,
                    hidden: [...preferences.data.hidden, id],
                  },
                }),
              )
            }
          >
            Hide section
          </button>
        </>
      )}
    </div>
  );
}
export function DeepWorkSetup({
  preferences,
  onClose,
}: {
  preferences: Entity<'briefing'>;
  onClose: () => void;
}) {
  const { today } = useProduct();
  const [task, setTask] = useState(''),
    [minutes, setMinutes] = useState(60),
    [error, setError] = useState('');
  async function start() {
    try {
      const now = workspace.clock.now(),
        hour = now.getHours() + now.getMinutes() / 60;
      if (hour + minutes / 60 > 24)
        throw new Error('Choose a duration that ends today.');
      const focus = workspace.make('Deep work', {
        type: 'event',
        date: today,
        start: hour,
        minutes,
        category: 'focus',
        taskId: task || null,
        travelMinutes: 0,
        location: '',
        ticket: 'none',
        reference: '',
      });
      await workspace.commit('Deep work started', [
        focus,
        {
          ...preferences,
          data: {
            ...preferences.data,
            deepWork: true,
            activeTask: task,
            focusEventId: focus.id,
          },
        },
      ]);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Focus could not be started.',
      );
    }
  }
  return (
    <Modal title="Start a deep-work block" onClose={onClose}>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void start();
        }}
      >
        <Field label="Active focus task">
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="">General focus</option>
            {workspace
              .visible('task')
              .filter((t) => t.kind === 'task' && !t.completed)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Focus block minutes">
          <input
            type="number"
            min="5"
            max="480"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </Field>
        <p>
          Reading and promotions become quiet. Unrelated pages dim; your focus
          block is saved in Calendar.
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className={s.primary}>
          Begin focus
        </button>
      </form>
    </Modal>
  );
}
