import { useState } from 'react';
import {
  availableSlots,
  overlap,
  planSteps,
} from '../../domain/product/schedule';
import { addDays, timeLabel } from '../../domain/product/dates';
import type { UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { Field } from './Common';
import { useProduct, entities, navigate } from './state';
import s from './product.module.css';
type Task = Extract<UserRecord, { kind: 'task' }>;
export function ScheduleAlignment({
  week,
  tasks,
}: {
  week: string;
  tasks: Task[];
}) {
  const { profile, busy } = useProduct();
  const events = entities('event');
  const eligible = [...tasks]
    .sort((a, b) =>
      (a.details?.deadline ?? '9999-12-31').localeCompare(
        b.details?.deadline ?? '9999-12-31',
      ),
    )
    .filter(
      (t) =>
        !events.some(
          (e) =>
            e.data.taskId === t.id &&
            e.data.date >= week &&
            e.data.date <= addDays(week, 6),
        ),
    );
  const [draft, setDraft] = useState(() => {
    const planned: {
      id: string;
      title: string;
      date: string;
      start: number;
      minutes: number;
    }[] = [];
    for (const task of eligible) {
      const end =
        task.details?.deadline && task.details.deadline < addDays(week, 6)
          ? task.details.deadline
          : addDays(week, 6);
      const slots = planSteps(
        profile,
        week,
        end,
        [{ title: task.title, minutes: 60 }],
        [
          ...events.map((e) => e.data),
          ...planned.map((p) => ({
            type: 'event' as const,
            date: p.date,
            start: p.start,
            minutes: p.minutes + 15,
            category: 'work' as const,
            taskId: p.id,
            travelMinutes: 0,
            location: '',
            ticket: 'none' as const,
            reference: '',
          })),
        ],
      );
      if (slots?.[0])
        planned.push({ id: task.id, title: task.title, ...slots[0] });
    }
    return planned;
  });
  const [notice, setNotice] = useState(''),
    [included, setIncluded] = useState<string[]>([]);
  const outings = entities('outing').filter(
    (o) => o.data.date >= week && o.data.date <= addDays(week, 6),
  );
  const missing = eligible.filter((t) => !draft.some((p) => p.id === t.id));
  function assign(id: string, date: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const others = draft.filter((d) => d.id !== id);
    const commitments = [
      ...events.map((e) => e.data),
      ...others.map((d) => ({
        type: 'event' as const,
        date: d.date,
        start: d.start,
        minutes: d.minutes + 15,
        category: 'work' as const,
        taskId: d.id,
        travelMinutes: 0,
        location: '',
        ticket: 'none' as const,
        reference: '',
      })),
    ];
    const slot = availableSlots(profile, date, date, commitments, 75, 15).find(
      (s) => !task.details?.deadline || s.date <= task.details.deadline,
    );
    if (!slot) {
      setNotice(
        'No available one-hour block with a buffer before this task’s deadline on that day.',
      );
      return;
    }
    setDraft([...others, { id, title: task.title, ...slot, minutes: 60 }]);
    setNotice('Draft moved. Approve when the week looks right.');
  }
  async function approve() {
    try {
      const calendar = entities('event').map((e) => e.data);
      const changes = draft.map((d) => {
        const task = tasks.find((t) => t.id === d.id);
        if (task?.details?.deadline && d.date > task.details.deadline)
          throw new Error(
            'A task now falls after its deadline. Update the draft.',
          );
        if (
          !availableSlots(profile, d.date, d.date, calendar, 75, 15).some(
            (s) => s.start === d.start,
          )
        )
          throw new Error(
            'The calendar changed while you reviewed. Refresh this draft before approving.',
          );
        const block = {
          type: 'event' as const,
          date: d.date,
          start: d.start,
          minutes: d.minutes,
          category: 'work' as const,
          taskId: d.id,
          travelMinutes: 0,
          location: '',
          ticket: 'none' as const,
          reference: '',
        };
        if (calendar.some((e) => overlap({ ...block, minutes: 75 }, e)))
          throw new Error('A draft block overlaps a commitment.');
        calendar.push({ ...block, minutes: 75 });
        return workspace.make(d.title, block);
      });
      await workspace.commit('Weekly task draft approved', changes);
      setDraft([]);
      setNotice('Approved task blocks are now on the calendar.');
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'Schedule could not be aligned.',
      );
    }
  }
  return (
    <>
      <p>
        Draft for week of {week}. Drag a task onto a day, or use its day
        selector. Blocks fit protected work hours with 15-minute buffers and
        deadline checks.
      </p>
      <div className={s.chips}>
        {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((date) => (
          <div
            className={s.dropTarget}
            key={date}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('application/x-nexus-task'))
                e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              assign(e.dataTransfer.getData('application/x-nexus-task'), date);
            }}
          >
            <strong>{date}</strong>
            {draft
              .filter((d) => d.date === date)
              .map((d) => (
                <p key={d.id}>
                  {timeLabel(d.start)} · {d.title}
                </p>
              ))}
          </div>
        ))}
      </div>
      {eligible.map((t) => (
        <div
          className={s.row}
          key={t.id}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData('application/x-nexus-task', t.id)
          }
        >
          <span>{t.title}</span>
          <Field label={`Weekly day for ${t.title}`}>
            <select
              value={draft.find((d) => d.id === t.id)?.date ?? ''}
              onChange={(e) => assign(t.id, e.target.value)}
            >
              <option value="">Not scheduled</option>
              {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map(
                (d) => (
                  <option key={d}>{d}</option>
                ),
              )}
            </select>
          </Field>
        </div>
      ))}
      {missing.length > 0 && (
        <p className={s.alert}>
          {missing.length} tasks do not fit before their deadlines. They remain
          unscheduled.
        </p>
      )}
      <div
        className={s.dropTarget}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-nexus-outing'))
            e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData('application/x-nexus-outing');
          if (outings.some((o) => o.id === id))
            setIncluded((v) => [...new Set([...v, id])]);
        }}
      >
        Drop a planned weekend outing here to include it in your weekly review.
      </div>
      {outings.map((o) => (
        <div
          className={s.row}
          key={o.id}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData('application/x-nexus-outing', o.id)
          }
        >
          <span>
            {o.title} · {o.data.date} · already on Calendar
          </span>
          <button
            type="button"
            aria-pressed={included.includes(o.id)}
            onClick={() =>
              setIncluded((v) =>
                v.includes(o.id) ? v.filter((id) => id !== o.id) : [...v, o.id],
              )
            }
          >
            {included.includes(o.id) ? 'Included in review' : 'Include outing'}
          </button>
        </div>
      ))}
      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={busy || !draft.length}
          onClick={() => void approve()}
        >
          Approve weekly draft
        </button>
        <button type="button" onClick={() => navigate('outdoors')}>
          Add a weekend outing
        </button>
        <button type="button" onClick={() => navigate('calendar')}>
          Review Calendar
        </button>
      </div>
      {notice && (
        <p role="status" className={s.alert}>
          {notice}
        </p>
      )}
    </>
  );
}
