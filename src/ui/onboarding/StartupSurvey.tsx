import { useMemo, useRef, useState } from 'react';
import type { Profile } from '../../domain/product/profile';
import type { Transaction } from '../../domain/records';
import { profileSchema } from '../../domain/product/profile';
import { project, threePaycheckMonths } from '../../domain/product/finance';
import { addMonths, daysBetween } from '../../domain/product/dates';
import { FinancialChart } from '../product/Chart';
import { workspace, downloadBackup } from '../local/runtime';
import { entities, useProduct } from '../product/state';
import { surveyJson, surveyResponses } from '../../domain/product/startup';
import { SurveyQuestion } from './SurveyQuestion';
import { SurveyScene } from './SurveyScene';
import { useSurveyScroll } from './useSurveyScroll';
import { collectSkipped } from './resolve-skipped';
import { Initialization } from './Initialization';
import { chapters, surveyQuestions } from './steps';
import { NectarineMark } from './SurveyOrnaments';
import s from './onboarding.module.css';
export function StartupSurvey({ onDone }: { onDone: () => void }) {
  const { baseProfile, today, busy, records } = useProduct();
  const [draft, setDraft] = useState<Profile>(() =>
    structuredClone(surveyResponses(baseProfile)),
  );
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState<Profile | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const { active: step, progress, goTo } = useSurveyScroll(root, !initializing);
  const [answered, setAnswered] = useState<Set<string>>(
    () =>
      new Set(
        baseProfile.completed
          ? surveyQuestions(baseProfile)
              .filter((q) => !baseProfile.skipped.includes(q.title))
              .map((q) => q.id)
          : [],
      ),
  );
  const steps = surveyQuestions(draft);
  const patch = (value: Partial<Profile>) => {
    const question = steps[step];
    if (question) setAnswered((v) => new Set([...v, question.id]));
    setDraft((p) => ({
      ...p,
      ...value,
      ...(Object.hasOwn(value, 'savingsCents') ? { balanceDate: today } : {}),
    }));
  };
  const reviewDraft = {
    ...draft,
    skipped: collectSkipped(draft.skipped, steps, answered),
  };
  const preview = useMemo(() => {
    try {
      return project(
        draft,
        today,
        daysBetween(today, addMonths(today, 12)),
        entities('purchase').map((p) => p.data),
        records.filter(
          (t): t is Transaction => t.kind === 'transaction' && !t.deletedAt,
        ),
        'Main',
        entities('subscription').map((s) => s.data),
      );
    } catch {
      return [];
    }
  }, [draft, today, records]);
  const three = threePaycheckMonths(
    draft,
    today,
    preview.at(-1)?.date ?? today,
  );
  async function advance(index: number, skip = false) {
    if (busy) return;
    const scrollAtStart = window.scrollY;
    const question = steps[index]!;
    const next = {
      ...draft,
      skipped: skip
        ? [...new Set([...draft.skipped, question.title])]
        : draft.skipped.filter((s) => s !== question.title),
    };
    if (!preview.length) {
      setError(
        'Financial amounts exceed safe projection limits. Reduce the values before continuing.',
      );
      return;
    }
    const parsed = profileSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check these values.');
      return;
    }
    if (
      !skip &&
      question.id === 'pay' &&
      draft.pay.cadence !== 'irregular' &&
      draft.pay.amountCents <= 0
    ) {
      setError('Enter positive net pay, or skip this question.');
      return;
    }
    if (
      question.id === 'deposit' &&
      draft.pay.nextDate !== baseProfile.pay.nextDate &&
      Math.abs(daysBetween(today, draft.pay.nextDate)) > 366
    ) {
      setError('Choose a deposit date within one year of today.');
      return;
    }
    if (draft.petBirthdate && draft.petBirthdate > today) {
      setError('Choose a pet birthdate on or before today.');
      return;
    }
    try {
      if (index === steps.length - 1) {
        setInitializing({
          ...next,
          skipped: collectSkipped(next.skipped, steps, answered),
          completed: true,
        });
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      await workspace.saveProfile(next);
      setDraft(next);
      setError('');
      setAnswered((v) => {
        const next = new Set(v);
        if (skip) next.delete(question.id);
        else next.add(question.id);
        return next;
      });
      if (Math.abs(window.scrollY - scrollAtStart) < 1) goTo(index + 1);
    } catch {
      setError('Your answers could not be saved. Please try again.');
    }
  }
  const quickStart = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setInitializing({
      ...baseProfile,
      completed: true,
      skipped: baseProfile.completed
        ? baseProfile.skipped
        : [
            ...new Set([
              ...baseProfile.skipped,
              ...steps.filter((s) => s.id !== 'review').map((s) => s.title),
            ]),
          ],
    });
  };
  return (
    <div
      className={`${s.survey} ${s.scrollJourney}`}
      ref={root}
      data-startup-survey
    >
      <SurveyScene progress={initializing ? 1 : progress} />
      <main className={s.canvas}>
        <header className={s.header}>
          <span className={s.wordmark}>
            <NectarineMark /> Catalyst
          </span>
          <span className={s.micro}>LOCAL FIRST · QUIET BY DESIGN</span>
        </header>
        {initializing ? (
          <Initialization
            profile={initializing}
            onDone={onDone}
            onBack={() => setInitializing(null)}
          />
        ) : (
          <>
            <section
              className={`${s.welcome} ${s.scrollStop}`}
              data-survey-stop={-1}
            >
              <p className={s.micro}>
                {baseProfile.completed
                  ? 'WELCOME BACK / YOUR FOUNDATION, REVISITED'
                  : 'FIRST THINGS FIRST / A PERSONAL FOUNDATION'}
              </p>
              <h1 tabIndex={-1}>
                A life with
                <br />
                room to <em>grow.</em>
              </h1>
              <p className={s.intro}>
                A few thoughtful questions about your money, time, and the
                things that matter. A calmer workspace, shaped around you.
              </p>
              <ol className={s.chapters}>
                {chapters.map((name, i) => (
                  <li key={name}>
                    <span>Ch. {i + 1}</span>
                    {name}
                  </li>
                ))}
              </ol>
              <div className={s.welcomeActions}>
                <button
                  className={s.primary}
                  type="button"
                  onClick={() => goTo(0)}
                >
                  {baseProfile.completed ? 'Review my answers' : 'Begin survey'}{' '}
                  <span aria-hidden="true">↗</span>
                </button>
                <button type="button" onClick={quickStart}>
                  {baseProfile.completed
                    ? 'Continue with saved answers'
                    : 'Skip all and start'}
                </button>
              </div>
              <p className={s.micro}>
                SCROLL AT YOUR PACE / {steps.length - 1} QUESTIONS / SKIP ANY
                QUESTION
              </p>
              <p className={s.small}>
                Your saved answers are prefilled at every startup. Setup never
                clears your existing records.
              </p>
            </section>
            {steps.map((question, index) => (
              <SurveyQuestion
                key={question.id}
                question={question}
                index={index}
                count={steps.length}
                active={step === index}
                draft={question.id === 'review' ? reviewDraft : draft}
                patch={patch}
                error={error}
                busy={busy}
                advance={advance}
                goTo={(index) => {
                  setError('');
                  goTo(index);
                }}
                preview={
                  <details className={s.preview} open={question.chapter === 0}>
                    <summary>YOUR NEXT 12 MONTHS / LIVE PREVIEW</summary>
                    {preview.length ? (
                      <FinancialChart points={preview} compact />
                    ) : (
                      <p role="status">
                        Check your financial values to restore the preview.
                      </p>
                    )}
                    {three.length > 0 && (
                      <p className={s.small}>
                        Three-paycheck months: {three.join(', ')}
                      </p>
                    )}
                    <p className={s.small}>
                      Income follows deposit dates. The dotted line includes
                      monthly bill estimates and planned purchases. Actual uses
                      verified transactions.
                    </p>
                  </details>
                }
              />
            ))}
          </>
        )}
        <footer className={s.footer}>
          <span>YOUR ANSWERS STAY ON THIS DEVICE.</span>
          {!initializing && (
            <button
              type="button"
              onClick={() => {
                try {
                  downloadBackup(surveyJson(draft), 'catalyst-survey.json');
                } catch {
                  setError('Check your answers before exporting.');
                  if (step < 0) goTo(0);
                }
              }}
            >
              Export survey JSON ↗
            </button>
          )}
          <span>CATALYST / PERSONAL</span>
        </footer>
      </main>
    </div>
  );
}
