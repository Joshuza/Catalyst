import { useState } from 'react';
import {
  profileSchema,
  defaultProfile,
  modeSchema,
  type Profile,
} from '../../domain/product/model';
import { project, threePaycheckMonths } from '../../domain/product/finance';
import { addDays, addMonths, daysBetween } from '../../domain/product/dates';
import { workspace } from '../local/runtime';
import { Page, Panel, Field, ToggleSet } from './Common';
import { FinancialChart } from './Chart';
import { useProduct, run } from './state';
import s from './product.module.css';
import { ProfileFinance } from './ProfileFinance';
import { ProfileWeek } from './ProfileWeek';
import { ProfileLifestyle } from './ProfileLifestyle';
const steps = [
  'Pay frequency',
  'Net pay',
  'Next deposit',
  'Liquid savings',
  'Secondary income',
  'Freelance estimates',
  'Working week',
  'Mobility',
  'Dietary needs',
  'Followed reading',
  'Outdoor activities',
  'Pet tracker',
];
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function ProfilePage() {
  const state = useProduct();
  const [draft, setDraft] = useState<Profile>(() =>
    structuredClone(state.baseProfile),
  );
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState(!state.profile.completed);
  const [error, setError] = useState('');
  const patch = (p: Partial<Profile>) =>
    setDraft((d) => {
      const groups: (keyof Profile)[][] = [
        ['pay'],
        ['pay'],
        ['pay'],
        ['savingsCents', 'overdraft'],
        ['streams'],
        ['invoiceCents', 'delayDays', 'lowMonthCents'],
        ['shifts'],
        ['modes', 'walkingMiles', 'distanceUnit'],
        ['dietary'],
        ['feeds'],
        ['activities', 'distanceTolerance', 'elevationTolerance'],
        ['petEnabled', 'petName', 'petSpecies', 'petBirthdate'],
      ];
      const resolved = !wizard
        ? steps.filter((_, i) =>
            groups[i]!.some((key) => Object.hasOwn(p, key)),
          )
        : [];
      return {
        ...d,
        ...p,
        ...(Object.hasOwn(p, 'savingsCents')
          ? { balanceDate: state.today }
          : {}),
        skipped: d.skipped.filter((v) => !resolved.includes(v)),
      };
    });
  const preview = project(
    draft,
    state.today,
    daysBetween(state.today, addMonths(state.today, 12)),
  );
  const three = threePaycheckMonths(
    draft,
    state.today,
    addDays(addMonths(state.today, 12), -1),
  );
  const save = async (skip = false, complete = false) => {
    const next = {
      ...draft,
      completed: complete || !wizard || step === steps.length - 1,
      skipped: !wizard
        ? draft.skipped
        : skip
          ? [...new Set([...draft.skipped, steps[step]!])]
          : draft.skipped.filter((v) => v !== steps[step]),
    };
    const parsed = profileSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check these values.');
      return;
    }
    if (step === 1 && !skip && draft.pay.amountCents <= 0) {
      setError('Enter positive net pay, or skip this question.');
      return;
    }
    if (
      (wizard || draft.pay.nextDate !== state.baseProfile.pay.nextDate) &&
      Math.abs(daysBetween(state.today, draft.pay.nextDate)) > 366
    ) {
      setError('Choose a deposit date within one year of today.');
      return;
    }
    if (draft.petBirthdate && draft.petBirthdate > state.today) {
      setError('Choose a pet birthdate on or before today.');
      return;
    }
    try {
      await workspace.saveProfile(next);
      setDraft(next);
      setError('');
      if (next.completed) setWizard(false);
      else setStep((n) => n + 1);
    } catch {
      setError('Preferences could not be saved. Your previous values remain.');
    }
  };
  const show = (i: number) => !wizard || step === i;
  return (
    <Page
      title={wizard ? 'Let’s make room for your life.' : 'Your preferences'}
      subtitle={
        wizard
          ? 'One question at a time. Every question can be skipped.'
          : 'Edits update projections, discovery, and scheduling immediately.'
      }
    >
      <div className={s.grid}>
        <Panel
          title={
            wizard
              ? `${step < 6 ? 'I / FINANCES' : step < 8 ? 'II / WEEK & MOBILITY' : 'III / LIFE'} · ${steps[step]}`
              : 'Personal profile'
          }
        >
          {wizard && (
            <>
              <progress
                className={s.progress}
                max={steps.length}
                value={step + 1}
              />
              <p className={s.muted}>
                Question {step + 1} of {steps.length}
              </p>
            </>
          )}
          <div className={s.form}>
            <ProfileFinance draft={draft} patch={patch} show={show} />
            <ProfileWeek draft={draft} patch={patch} show={show} />
            <ProfileLifestyle draft={draft} patch={patch} show={show} />
            {!wizard && (
              <Field label="Weekly reset day">
                <select
                  value={draft.resetDay}
                  onChange={(e) => patch({ resetDay: Number(e.target.value) })}
                >
                  {days.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {error && (
              <p role="alert" className={s.alert}>
                {error}
              </p>
            )}
            <div className={s.actions}>
              {wizard && (
                <>
                  <button
                    type="button"
                    disabled={!step}
                    onClick={() => setStep((n) => n - 1)}
                  >
                    Back
                  </button>
                  <button type="button" onClick={() => run(save(true))}>
                    Skip this question
                  </button>
                </>
              )}
              <button
                type="button"
                className={s.primary}
                disabled={state.busy}
                onClick={() => run(save())}
              >
                {wizard
                  ? step === steps.length - 1
                    ? 'Finish setup'
                    : 'Continue'
                  : 'Save preferences'}
              </button>
            </div>
            {wizard && (
              <button
                type="button"
                onClick={() => {
                  const p = {
                    ...defaultProfile(state.today),
                    completed: true,
                    skipped: [...steps],
                  };
                  run(
                    workspace.saveProfile(p).then(() => {
                      setDraft(p);
                      setWizard(false);
                    }),
                  );
                }}
              >
                Skip all and start
              </button>
            )}
          </div>
        </Panel>
        <div className={s.stack}>
          <Panel title="Your next 12 months">
            <FinancialChart points={preview} />
            <p className={s.muted}>
              Baseline follows your actual deposit dates. Actual stays at
              savings until verified transactions are logged.
            </p>
            {three.length > 0 && (
              <p>Three-paycheck months: {three.join(', ')}</p>
            )}
          </Panel>
          <Panel title="Private by default">
            <p>
              Your answers stay encrypted on this device. Every saved change can
              be undone.
            </p>
            <p className={s.muted}>
              Skipped questions return in your weekly reset. Pet Tracker stays
              hidden until enabled.
            </p>
          </Panel>
          {!wizard && <TemporaryOverride />}
        </div>
      </div>
    </Page>
  );
}
function TemporaryOverride() {
  const { profile, today } = useProduct();
  const [until, setUntil] = useState(addDays(today, 7)),
    [modes, setModes] = useState(profile.modes),
    [remote, setRemote] = useState(false);
  return (
    <Panel title="Temporary week override">
      <Field label="Override until">
        <input
          type="date"
          min={today}
          value={until}
          onChange={(e) => setUntil(e.target.value)}
        />
      </Field>
      <ToggleSet
        label="Available transit this week"
        options={modeSchema.options}
        values={modes}
        onChange={(v) => setModes(v as Profile['modes'])}
      />
      <label>
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
        />
        No protected hours this week
      </label>
      <button
        type="button"
        onClick={() =>
          run(
            workspace.save(
              workspace.make('Temporary preferences', {
                type: 'override',
                until,
                modes,
                shifts: remote ? [] : profile.shifts,
              }),
            ),
          )
        }
      >
        Save temporary override
      </button>
    </Panel>
  );
}
