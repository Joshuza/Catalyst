import { useState } from 'react';
import { timeLabel } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Panel, Field, MoneyField } from './Common';
import { useProduct, entities, run, type Entity } from './state';
import { ReceiptPrinter } from './Animations';
import s from './product.module.css';
function GearRow({
  outing,
  index,
  onPlan,
}: {
  outing: Entity<'outing'>;
  index: number;
  onPlan: (
    outing: Entity<'outing'>,
    index: number,
    cost: number,
  ) => Promise<void>;
}) {
  const gear = outing.data.gear[index]!;
  const [cost, setCost] = useState(gear.costCents);
  const { busy } = useProduct();
  return (
    <div
      className={s.row}
      draggable={!gear.owned && cost > 0}
      onDragStart={(e) =>
        e.dataTransfer.setData(
          'application/x-nexus-gear',
          `${outing.id}:${index}:${cost}`,
        )
      }
    >
      <label>
        <input
          type="checkbox"
          checked={gear.owned}
          disabled={busy}
          onChange={(e) =>
            run(
              workspace.save({
                ...outing,
                data: {
                  ...outing.data,
                  gear: outing.data.gear.map((g, i) =>
                    i === index ? { ...g, owned: e.target.checked } : g,
                  ),
                },
              }),
            )
          }
        />
        {gear.name}
      </label>
      <MoneyField
        label={`Cost for ${gear.name}`}
        cents={cost}
        onChange={setCost}
      />
      {!gear.owned && cost > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(onPlan(outing, index, cost))}
        >
          Add gear to cart
        </button>
      )}
    </div>
  );
}
export function OutingGear() {
  const { busy } = useProduct();
  const [message, setMessage] = useState(''),
    [printed, setPrinted] = useState<{ title: string; cents: number } | null>(
      null,
    );
  async function plan(outing: Entity<'outing'>, index: number, cost: number) {
    try {
      if (busy) return;
      const gear = outing.data.gear[index];
      if (!gear || gear.owned || !Number.isSafeInteger(cost) || cost <= 0)
        throw new Error('Enter a positive estimated cost for missing gear.');
      const purchase = workspace.make(gear.name, {
        type: 'purchase',
        costCents: cost,
        date: outing.data.date,
        status: 'planned',
        scenario: 'Main',
        actualCents: null,
        regret: null,
        emotion: null,
        transactionId: null,
      });
      await workspace.commit('Gear purchase planned', [
        purchase,
        {
          ...outing,
          data: {
            ...outing.data,
            gear: outing.data.gear.map((g, i) =>
              i === index ? { ...g, costCents: cost } : g,
            ),
          },
        },
      ]);
      setPrinted({ title: gear.name, cents: cost });
      setMessage(
        'Gear purchase added to the cart projection. No payment was made.',
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gear could not be planned.');
    }
  }
  return (
    <Panel title="Planned gear & sharing">
      {entities('outing').map((o) => (
        <article key={o.id} className={s.panel}>
          <h3>
            {o.title} · {o.data.date}
          </h3>
          {o.data.route && (
            <p>
              {o.data.route.mode} · {o.data.route.minutes} minutes to the
              trailhead · leave {timeLabel(o.data.route.departure)} · back by{' '}
              {timeLabel(o.data.route.backBy)}
            </p>
          )}
          {o.data.gear.map((g, i) => (
            <GearRow key={g.name} outing={o} index={i} onPlan={plan} />
          ))}
          <Field label="Share with trusted contact">
            <select
              defaultValue=""
              onChange={(e) => {
                const contact = entities('contact').find(
                  (c) => c.id === e.target.value,
                );
                const event = entities('event').find(
                  (v) => v.id === o.data.eventId,
                );
                if (contact)
                  void navigator.clipboard
                    .writeText(
                      `${contact.title}, my plan: ${o.title}, ${o.data.date}, ${event ? timeLabel(event.data.start) : ''}. Back by ${event ? timeLabel(event.data.start + event.data.minutes / 60) : ''}.`,
                    )
                    .then(() =>
                      setMessage('Plan copied. Send it yourself when ready.'),
                    )
                    .catch(() =>
                      setMessage(
                        'Clipboard unavailable. Copy the plan details above.',
                      ),
                    );
              }}
            >
              <option value="">Choose a contact to copy a message</option>
              {entities('contact')
                .filter((c) => c.data.trusted)
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
          </Field>
        </article>
      ))}
      <div
        className={s.dropTarget}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-nexus-gear'))
            e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const [id, i, cost] = e.dataTransfer
            .getData('application/x-nexus-gear')
            .split(':');
          const outing = entities('outing').find((o) => o.id === id);
          if (outing && Number.isInteger(Number(i)))
            run(plan(outing, Number(i), Number(cost)));
        }}
      >
        Drop missing gear here to add it to your cart. Add gear to cart works by
        keyboard and touch.
      </div>
      {printed && <ReceiptPrinter key={printed.title} {...printed} planned />}
      {message && <p role="status">{message}</p>}
    </Panel>
  );
}
