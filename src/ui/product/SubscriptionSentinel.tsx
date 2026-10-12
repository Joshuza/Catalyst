import { useState } from 'react';
import { trialHours } from '../../domain/product/evolution';
import { annualCost } from '../../domain/product/finance';
import { daysBetween, timeLabel } from '../../domain/product/dates';
import { personalSlot } from '../../domain/product/schedule';
import { workspace } from '../local/runtime';
import { Panel, DeleteRecord } from './Common';
import { SubscriptionPayment } from './SubscriptionPayment';
import { SubscriptionForm } from './SubscriptionForm';
import { useProduct, entities, money, type Entity } from './state';
import s from './product.module.css';
export function SubscriptionSentinel() {
  const { today, profile } = useProduct();
  const [notice, setNotice] = useState('');
  const items = entities('subscription').sort((a, b) =>
    a.data.nextDate.localeCompare(b.data.nextDate),
  );
  const urgent = items.filter(
    (i) =>
      i.data.nextDate === today ||
      (trialHours(i.data.trialEnd, workspace.clock.now(), i.data.trialEndAt)! >=
        0 &&
        trialHours(
          i.data.trialEnd,
          workspace.clock.now(),
          i.data.trialEndAt,
        )! <= 48 &&
        i.data.trialEnd),
  );
  async function remind(item: Entity<'subscription'>) {
    try {
      const date =
        (item.data.trialEnd ?? item.data.nextDate) < today
          ? today
          : (item.data.trialEnd ?? item.data.nextDate);
      const slot = personalSlot(
        profile,
        date,
        entities('event').map((e) => e.data),
        18,
        15,
      );
      if (!slot)
        throw new Error(
          'No free time outside protected hours. Choose a reminder time in Calendar.',
        );
      await workspace.save(
        workspace.make(`Review ${item.title}`, {
          type: 'event',
          ...slot,
          category: 'personal',
          taskId: null,
          travelMinutes: 0,
          location: '',
          ticket: 'none',
          reference: '',
        }),
      );
      setNotice(
        `Reminder added ${date} at ${timeLabel(slot.start)}, outside protected hours.`,
      );
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'The reminder could not be saved.',
      );
    }
  }
  return (
    <Panel title="Subscription sentinel">
      {urgent.length > 0 && (
        <div className={s.alert} role="status">
          {urgent.map((i) => i.title).join(', ')}: a bill is due today or a
          trial ends within 48 hours.
        </div>
      )}
      <SubscriptionForm />
      {['Trials', 'Recurring charges'].map((group) => (
        <div key={group}>
          <h3>{group}</h3>
          {items
            .filter((i) =>
              group === 'Trials' ? !!i.data.trialEnd : !i.data.trialEnd,
            )
            .map((item) => (
              <div className={s.row} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p className={s.muted}>
                    {money(
                      item.data.cadence === 'annual'
                        ? Math.round(item.data.amountCents / 12)
                        : item.data.amountCents,
                      item.data.currency ?? profile.currency,
                    )}{' '}
                    / month ·{' '}
                    {money(
                      annualCost(item.data),
                      item.data.currency ?? profile.currency,
                    )}{' '}
                    / year
                  </p>
                  <p
                    data-urgency={
                      item.data.trialEnd &&
                      daysBetween(today, item.data.trialEnd) <= 2
                        ? 'urgent'
                        : 'calm'
                    }
                  >
                    {item.data.trialEnd
                      ? `Trial ${(trialHours(item.data.trialEnd, workspace.clock.now(), item.data.trialEndAt) ?? 0) < 0 ? 'ended' : `ends in ${trialHours(item.data.trialEnd, workspace.clock.now(), item.data.trialEndAt)} hours`} · ${item.data.trialEnd}`
                      : `Next bill ${item.data.nextDate}`}
                  </p>
                </div>
                <div className={s.actions}>
                  {item.data.billingUrl && (
                    <a
                      href={item.data.billingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Billing page
                    </a>
                  )}
                  <button type="button" onClick={() => void remind(item)}>
                    Add reminder
                  </button>
                  <SubscriptionPayment item={item} />
                  <DeleteRecord record={item} />
                </div>
              </div>
            ))}
        </div>
      ))}
      {!items.length && (
        <p className={s.empty}>
          Track recurring costs and trial dates. Add your first subscription
          above.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <p className={s.muted}>
        Catalyst links to billing pages and never cancels a subscription for you.
      </p>
    </Panel>
  );
}
