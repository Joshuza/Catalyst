import type { Profile } from '../../domain/product/profile';
import { money } from '../product/state';
import { surveyJson } from '../../domain/product/startup';
import { downloadBackup } from '../local/runtime';
import s from './onboarding.module.css';
export function SurveyReview({ draft }: { draft: Profile }) {
  return (
    <div className={s.review}>
      <dl>
        <div>
          <dt>FINANCIAL FOUNDATION</dt>
          <dd>
            {money(draft.pay.amountCents, draft.currency)} / {draft.pay.cadence}
            <br />
            {money(draft.savingsCents, draft.currency)} liquid balance
            <br />
            {draft.fixedExpenses?.length ?? 0} monthly bill estimates
          </dd>
        </div>
        <div>
          <dt>YOUR WORKING WEEK</dt>
          <dd>
            {draft.persona ?? 'hybrid'} · {draft.calendarZoom ?? 'week'} view
            <br />
            {new Set(draft.shifts.map((s) => s.day)).size} working days ·{' '}
            {draft.shifts.reduce((n, s) => n + s.end - s.start, 0)} protected
            hours
          </dd>
        </div>
        <div>
          <dt>MOVEMENT & REACH</dt>
          <dd>
            {draft.modes.join(', ') || 'No modes selected'}
            <br />
            {draft.walkingMiles === 0
              ? 'Walking excluded'
              : `${(draft.walkingMiles * (draft.distanceUnit === 'km' ? 1.609344 : 1)).toFixed(1)} ${draft.distanceUnit} walking ceiling`}
          </dd>
        </div>
        <div>
          <dt>LIFE & ATTENTION</dt>
          <dd>
            {draft.dietary.join(', ') || 'No dietary restrictions'}
            <br />
            {draft.feeds.length} publications · {draft.mediaTopics?.length ?? 0}{' '}
            topics
            <br />
            Pet Tracker{' '}
            {draft.petEnabled ? `on for ${draft.petName || 'your pet'}` : 'off'}
          </dd>
        </div>
      </dl>
      {draft.skipped.length > 0 && (
        <p>
          {draft.skipped.length} skipped questions will return in your weekly
          reset.
        </p>
      )}
      <button
        type="button"
        onClick={() => downloadBackup(surveyJson(draft), 'nexus-survey.json')}
      >
        Export survey JSON
      </button>
      <p className={s.micro}>
        The export contains your answers, including financial values. Keep it
        somewhere private.
      </p>
    </div>
  );
}
