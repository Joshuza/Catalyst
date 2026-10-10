import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../../domain/product/profile';
import { profileSchema } from '../../domain/product/profile';
import { project, threePaycheckMonths } from '../../domain/product/finance';
import { addMonths, daysBetween } from '../../domain/product/dates';
import { FinancialChart } from '../product/Chart';
import { workspace, downloadBackup } from '../local/runtime';
import { entities, useProduct } from '../product/state';
import { surveyJson, surveyResponses } from '../../domain/product/startup';
import { SurveyFields } from './SurveyFields';
import { Initialization } from './Initialization';
import { chapters, surveyQuestions } from './steps';
import { ArtFrame, NectarineMark } from './SurveyOrnaments';
import artwork from '../../assets/oasis-nectarines.png';
import s from './onboarding.module.css';
import p from '../product/product.module.css';
export function StartupSurvey({ onDone }: { onDone: () => void }) {
  const { baseProfile, today, busy } = useProduct();
  const [draft, setDraft] = useState<Profile>(() =>
    structuredClone(surveyResponses(baseProfile)),
  );
  const [step, setStep] = useState(-1);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState<Profile | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = surveyQuestions(draft);
  const question = steps[Math.max(0, step)]!;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  const patch = (value: Partial<Profile>) =>
    setDraft((p) => ({
      ...p,
      ...value,
      ...(Object.hasOwn(value, 'savingsCents') ? { balanceDate: today } : {}),
    }));
  const preview = (() => {
    try {
      return project(
        draft,
        today,
        daysBetween(today, addMonths(today, 12)),
        entities('purchase').map((p) => p.data),
        workspace
          .visible('transaction')
          .filter((t) => t.kind === 'transaction'),
        'Main',
        entities('subscription').map((s) => s.data),
      );
    } catch {
      return [];
    }
  })();
  const three = threePaycheckMonths(
    draft,
    today,
    preview.at(-1)?.date ?? today,
  );
  async function advance(skip = false) {
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
      if (step === steps.length - 1) {
        setInitializing({ ...next, completed: true });
        return;
      }
      await workspace.saveProfile(next);
      setDraft(next);
      setError('');
      setStep((v) => v + 1);
    } catch {
      setError('Your answers could not be saved. Please try again.');
    }
  }
  const quickStart = () =>
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
  return (
    <div className={s.survey} data-startup-survey>
      <aside className={s.art}>
        <img
          src={artwork}
          alt="Renaissance-style painting of artisans building a sandstone pavilion beside an Egyptian oasis, with ripe nectarines in the foreground."
          decoding="async"
        />
        <ArtFrame />
        <div className={s.artTop}>
          <span>NEXUS OS</span>
          <span>PERSONAL EDITION / 01</span>
        </div>
        <div className={s.artCaption}>
          <span className={s.micro}>A STUDY IN POSSIBILITY</span>
          <p>
            Good things <br />
            take shape <br />
            <em>with care.</em>
          </p>
          <span className={s.micro}>AN OASIS FOR YOUR EVERYDAY</span>
        </div>
      </aside>
      <main className={s.canvas}>
        <header className={s.header}>
          <span className={s.wordmark}>
            <NectarineMark /> Nexus<span>OS</span>
          </span>
          <span className={s.micro}>LOCAL FIRST · QUIET BY DESIGN</span>
        </header>
        {initializing ? (
          <Initialization
            profile={initializing}
            onDone={onDone}
            onBack={() => setInitializing(null)}
          />
        ) : step === -1 ? (
          <section className={s.welcome}>
            <p className={s.micro}>
              {baseProfile.completed
                ? 'WELCOME BACK / YOUR FOUNDATION, REVISITED'
                : 'FIRST THINGS FIRST / A PERSONAL FOUNDATION'}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              A life with
              <br />
              room to <em>grow.</em>
            </h1>
            <p className={s.intro}>
              A few thoughtful questions about your money, time, and the things
              that matter. A calmer workspace, shaped around you.
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
                onClick={() => setStep(0)}
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
              ONE QUESTION AT A TIME / {steps.length - 1} QUESTIONS / SKIP ANY
              QUESTION
            </p>
            <p className={s.small}>
              Your saved answers are prefilled at every startup. Setup never
              clears your existing records.
            </p>
          </section>
        ) : (
          <section className={s.question} key={question.id}>
            <nav className={s.chapterNav} aria-label="Survey chapters">
              {chapters.map((name, i) => (
                <span
                  key={name}
                  aria-current={i === question.chapter ? 'step' : undefined}
                >
                  Ch. {i + 1}
                  <span>{name}</span>
                </span>
              ))}
            </nav>
            <progress
              max={steps.length}
              value={step + 1}
              aria-label="Survey progress"
            />
            <p className={s.micro}>
              CHAPTER 0{question.chapter + 1} / QUESTION {step + 1} OF{' '}
              {steps.length}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              {question.title}
            </h1>
            <p className={s.description}>{question.description}</p>
            <form
              className={`${s.form} ${p.form}`}
              onSubmit={(e) => {
                e.preventDefault();
                void advance();
              }}
            >
              <SurveyFields
                key={question.id}
                draft={draft}
                patch={patch}
                question={question.id}
              />
              {error && <p role="alert">{error}</p>}
              <div className={s.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep((v) => v - 1);
                  }}
                >
                  Back
                </button>
                {question.id !== 'review' && (
                  <button type="button" onClick={() => void advance(true)}>
                    Skip this question
                  </button>
                )}
                <button type="submit" className={s.primary} disabled={busy}>
                  {question.id === 'review'
                    ? 'Initialize my workspace'
                    : 'Continue'}{' '}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
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
                Income follows deposit dates. The dotted line includes your
                monthly bill estimates and planned purchases. Actual uses
                verified transactions.
              </p>
            </details>
          </section>
        )}
        <footer className={s.footer}>
          <span>YOUR ANSWERS STAY ON THIS DEVICE.</span>
          {!initializing && (
            <button
              type="button"
              onClick={() => {
                try {
                  downloadBackup(surveyJson(draft), 'nexus-survey.json');
                } catch {
                  setError('Check your answers before exporting.');
                  if (step < 0) setStep(0);
                }
              }}
            >
              Export survey JSON ↗
            </button>
          )}
          <span>N / OS</span>
        </footer>
      </main>
    </div>
  );
}
