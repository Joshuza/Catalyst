import { useEffect, useRef, useState } from 'react';
import {
  addDays,
  weekStart,
  weekday,
  timeLabel,
} from '../../domain/product/dates';
import { availableSlots, overlap } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Modal } from '../local/Modal';
import { Page, Panel, Field, DeleteRecord } from './Common';
import { Ticket } from './Animations';
import {
  useProduct,
  entities,
  run,
  type Entity,
  takeCalendarDate,
} from './state';
import s from './product.module.css';
import { CalendarEditor } from './CalendarEditor';
import { EventButton } from './EventButton';
const bands = ['30 minutes', 'Hourly', 'Pacing', 'Working week'];
export function CalendarPage() {
  const { today, profile } = useProduct();
  const [date, setDate] = useState(() => takeCalendarDate(today)),
    [zoom, setZoom] = useState(3),
    [editing, setEditing] = useState<Entity<'event'> | null>(null),
    [selected, setSelected] = useState<Entity<'event'> | null>(null),
    [draftSlot, setDraftSlot] = useState<{
      date: string;
      start: number;
    } | null>(null),
    [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null),
    pinch = useRef(0);
  const events = entities('event'),
    tasks = workspace
      .visible('task')
      .filter((t) => t.kind === 'task' && !t.completed);
  const first = weekStart(date),
    dates = Array.from({ length: 7 }, (_, i) => addDays(first, i));
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest('input,textarea,select') ||
        document.querySelector('dialog[open]')
      )
        return;
      if (/^[1-4]$/.test(e.key)) setZoom(Number(e.key) - 1);
    };
    const focus = (e: Event) => setDate((e as CustomEvent<string>).detail);
    const node = ref.current;
    const wheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        setZoom((z) => Math.max(0, Math.min(3, z + (e.deltaY > 0 ? 1 : -1))));
      }
    };
    window.addEventListener('keydown', key);
    window.addEventListener('nexus:calendar-date', focus);
    node?.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('nexus:calendar-date', focus);
      node?.removeEventListener('wheel', wheel);
    };
  }, []);
  const scheduleTask = (id: string, d: string, start: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const event = workspace.make(task.title, {
      type: 'event',
      date: d,
      start,
      minutes: 60,
      category: 'work',
      taskId: task.id,
      travelMinutes: 0,
      location: '',
      ticket: 'none',
      reference: '',
    });
    if (
      events.some((e) => overlap(event.data as Entity<'event'>['data'], e.data))
    ) {
      setError('That slot overlaps an existing event. Choose another time.');
      return;
    }
    run(workspace.save(event));
  };
  return (
    <Page
      title="Your calendar"
      subtitle="Change the planning scale without losing your place. Protected hours follow your working week."
      action={
        <button
          type="button"
          onClick={() => {
            setDraftSlot({ date, start: 9 });
          }}
        >
          Add event
        </button>
      }
    >
      <div
        ref={ref}
        onTouchStart={(e) => {
          if (e.touches.length === 2)
            pinch.current = Math.hypot(
              e.touches[0]!.clientX - e.touches[1]!.clientX,
              e.touches[0]!.clientY - e.touches[1]!.clientY,
            );
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current) {
            const distance = Math.hypot(
              e.touches[0]!.clientX - e.touches[1]!.clientX,
              e.touches[0]!.clientY - e.touches[1]!.clientY,
            );
            if (Math.abs(distance - pinch.current) > 50) {
              setZoom((z) =>
                Math.max(
                  0,
                  Math.min(3, z + (distance > pinch.current ? -1 : 1)),
                ),
              );
              pinch.current = distance;
            }
          }
        }}
      >
        <div className={s.actions}>
          <button
            type="button"
            onClick={() => setDate(addDays(date, zoom === 3 ? -7 : -1))}
          >
            Previous
          </button>
          <Field label="Focused calendar date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <button
            type="button"
            onClick={() => setDate(addDays(date, zoom === 3 ? 7 : 1))}
          >
            Next
          </button>
          <div className={s.chips}>
            {bands.map((b, i) => (
              <button
                key={b}
                type="button"
                aria-pressed={zoom === i}
                onClick={() => setZoom(i)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <p className={s.muted}>
          Keys 1-4, pinch, or Ctrl/Cmd + scroll change the view. Focused date:{' '}
          {date}.
        </p>
        {error && <p role="alert">{error}</p>}
        <Panel
          title={zoom < 2 ? `${date} · ${bands[zoom]}` : `Week of ${first}`}
        >
          {zoom < 2 ? (
            <>
              <p>
                {availableSlots(
                  profile,
                  date,
                  date,
                  events.map((e) => e.data),
                ).length / 2}{' '}
                working hours unassigned
              </p>
              <div className={s.stack}>
                {Array.from(
                  { length: zoom === 0 ? 48 : 24 },
                  (_, i) => i * (zoom === 0 ? 0.5 : 1),
                ).map((h) => (
                  <div
                    key={h}
                    className={s.row}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      scheduleTask(
                        e.dataTransfer.getData('text/nexus-task'),
                        date,
                        h,
                      );
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDraftSlot({ date, start: h });
                      }}
                    >
                      {timeLabel(h)}
                    </button>
                    {events
                      .filter(
                        (e) =>
                          e.data.date === date &&
                          e.data.start >= h &&
                          e.data.start < h + (zoom === 0 ? 0.5 : 1),
                      )
                      .map((e) => (
                        <button
                          type="button"
                          key={e.id}
                          onClick={() => setSelected(e)}
                        >
                          {e.title} · {e.data.minutes} min
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={s.tableWrap}>
              <div className={s.calendar}>
                {dates.map((d) => (
                  <div
                    className={`${s.day} ${profile.shifts.some((v) => v.day === weekday(d)) ? '' : s.dayQuiet}`}
                    key={d}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDate(d);
                        setZoom(1);
                      }}
                    >
                      {new Intl.DateTimeFormat(workspace.locale, {
                        weekday: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(`${d}T12:00Z`))}
                      <br />
                      {d.slice(8)}
                    </button>
                    {zoom === 2
                      ? [
                          ['Morning', 0, 12],
                          ['Afternoon', 12, 18],
                          ['Evening', 18, 24],
                        ].map(([label, start, end]) => (
                          <div key={label}>
                            <h3>{label}</h3>
                            {events
                              .filter(
                                (e) =>
                                  e.data.date === d &&
                                  e.data.start >= Number(start) &&
                                  e.data.start < Number(end),
                              )
                              .map((e) => (
                                <EventButton
                                  key={e.id}
                                  event={e}
                                  onClick={() => setSelected(e)}
                                />
                              ))}
                          </div>
                        ))
                      : events
                          .filter((e) => e.data.date === d)
                          .sort((a, b) => a.data.start - b.data.start)
                          .map((e) => (
                            <EventButton
                              key={e.id}
                              event={e}
                              onClick={() => setSelected(e)}
                            />
                          ))}
                    <button
                      type="button"
                      onClick={() => {
                        setDraftSlot({ date: d, start: 9 });
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
        <Panel title="Unscheduled tasks">
          <p className={s.muted}>
            Drag a task into an hourly slot, or use Schedule to choose its date
            and time.
          </p>
          {tasks.map((t) => (
            <div
              className={s.row}
              key={t.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData('text/nexus-task', t.id)
              }
            >
              <span>{t.title}</span>
              <button
                type="button"
                onClick={() => {
                  const slot = availableSlots(
                    profile,
                    date,
                    addDays(date, 14),
                    events.map((e) => e.data),
                    60,
                  )[0];
                  if (slot) scheduleTask(t.id, slot.date, slot.start);
                  else
                    setError(
                      'No free working slot is available in the next two weeks.',
                    );
                }}
              >
                Schedule in next free working slot
              </button>
            </div>
          ))}
        </Panel>
      </div>
      {draftSlot && (
        <CalendarEditor
          slot={draftSlot}
          existing={editing}
          onClose={() => {
            setDraftSlot(null);
            setEditing(null);
          }}
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className={s.page}>
            <p>
              {selected.data.date} · {timeLabel(selected.data.start)} ·{' '}
              {selected.data.minutes} minutes
            </p>
            {selected.data.ticket !== 'none' && <Ticket event={selected} />}
            <button
              type="button"
              onClick={() => {
                setDraftSlot({
                  date: selected.data.date,
                  start: selected.data.start,
                });
                setSelected(null);
                setEditing(selected);
              }}
            >
              Edit or move event
            </button>
            <DeleteRecord record={selected} />
          </div>
        </Modal>
      )}
    </Page>
  );
}
