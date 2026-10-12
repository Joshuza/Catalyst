import { useEffect, useRef, useState } from 'react';
import {
  initializeProfile,
  surveyResponses,
  INITIALIZATION_MS,
} from '../../domain/product/startup';
import type { Profile } from '../../domain/product/profile';
import { workspace } from '../local/runtime';
import { entities, useProduct } from '../product/state';
import { FinancialChart } from '../product/Chart';
import s from './onboarding.module.css';
type InitializationResult = ReturnType<typeof initializeProfile>;
export function Initialization({
  profile,
  onDone,
  onBack,
}: {
  profile: Profile;
  onDone: () => void;
  onBack: () => void;
}) {
  const { today } = useProduct();
  const [result, setResult] = useState<InitializationResult | null>(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    try {
      const normalized = surveyResponses(profile);
      const computed = initializeProfile(
        normalized,
        today,
        entities('purchase').map((p) => p.data),
        workspace
          .visible('transaction')
          .filter((t) => t.kind === 'transaction'),
        entities('subscription').map((s) => s.data),
      );
      setResult(computed);
      setStage(1);
      timers.push(setTimeout(() => setStage(2), INITIALIZATION_MS / 3));
      timers.push(setTimeout(() => setStage(3), (INITIALIZATION_MS * 2) / 3));
      timers.push(
        setTimeout(() => {
          void workspace
            .saveProfile(normalized)
            .then(() => {
              if (active) onDoneRef.current();
            })
            .catch(() => {
              if (active)
                setError(
                  'Your setup could not be saved. Return to your answers and try again.',
                );
            });
        }, INITIALIZATION_MS),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check your setup values.');
    }
    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, [profile, today]);
  return (
    <section className={s.initializing} aria-labelledby="initialization-title">
      <p className={s.micro}>CATALYST / ESTABLISHING YOUR FOUNDATION</p>
      <h1 id="initialization-title">Initializing Catalyst Command Engine...</h1>
      <p>Your plans are taking shape on this device.</p>
      <progress
        aria-label="Initialization progress"
        max={3}
        value={error ? 0 : stage}
      />
      <ol className={s.stages} aria-live="polite">
        <li data-complete={stage >= 1}>
          01 · Compute baseline financial graphs
        </li>
        <li data-complete={stage >= 2}>02 · Mask calendar working hours</li>
        <li data-complete={stage >= 3}>
          03 · Initialize news and transit rule matrices
        </li>
      </ol>
      {result && (
        <>
          <FinancialChart points={result.financial} compact />
          <div
            className={s.mask}
            aria-label={`${result.workingHours.flat().filter(Boolean).length / 2} protected working hours`}
          >
            {result.workingHours.map((slots, day) => (
              <div key={day}>
                <span>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}</span>
                {slots.map((busy, i) => (
                  <i key={i} data-protected={busy} />
                ))}
              </div>
            ))}
          </div>
          {stage >= 3 && (
            <p className={s.micro}>
              {result.rules.news.sources.length} SOURCES /{' '}
              {result.rules.transit.modes.length} TRANSIT MODES / WALKING LIMIT{' '}
              {result.rules.transit.maximumWalkingMiles.toFixed(1)} MI
            </p>
          )}
        </>
      )}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={onBack}>
            Return to survey
          </button>
        </>
      )}
    </section>
  );
}
