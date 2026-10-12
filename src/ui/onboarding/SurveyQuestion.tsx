import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Profile } from '../../domain/product/profile';
import { chapters, type surveyQuestions } from './steps';
import { SurveyFields } from './SurveyFields';
import s from './onboarding.module.css';
import p from '../product/product.module.css';
type Question = ReturnType<typeof surveyQuestions>[number];
export function SurveyQuestion({
  question,
  index,
  count,
  active,
  draft,
  patch,
  error,
  busy,
  preview,
  advance,
  goTo,
}: {
  question: Question;
  index: number;
  count: number;
  active: boolean;
  draft: Profile;
  patch: (p: Partial<Profile>) => void;
  error: string;
  busy: boolean;
  preview: ReactNode;
  advance: (index: number, skip?: boolean) => Promise<void>;
  goTo: (index: number) => void;
}) {
  const section = useRef<HTMLElement>(null);
  const [reservedHeight, setReservedHeight] = useState(0);
  useLayoutEffect(() => {
    if (!active || !section.current) return;
    const node = section.current;
    const measure = () =>
      setReservedHeight((height) =>
        Math.max(height, node.getBoundingClientRect().height),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);
  return (
    <section
      ref={section}
      style={reservedHeight ? { minHeight: reservedHeight } : undefined}
      className={`${s.question} ${s.scrollStop}`}
      data-survey-stop={index}
      data-survey-active={active}
      aria-labelledby={`survey-${question.id}`}
    >
      <p className={s.micro}>
        CHAPTER 0{question.chapter + 1} / QUESTION {index + 1} OF {count}
      </p>
      <h1 id={`survey-${question.id}`} tabIndex={-1}>
        {question.title}
      </h1>
      <p className={s.description}>{question.description}</p>
      {active ? (
        <>
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
            max={count}
            value={index + 1}
            aria-label="Survey progress"
          />
          <form
            className={`${s.form} ${p.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              void advance(index);
            }}
          >
            <fieldset disabled={busy}>
              <SurveyFields
                draft={draft}
                patch={patch}
                question={question.id}
              />
            </fieldset>
            {error && <p role="alert">{error}</p>}
            <div className={s.formActions}>
              <button
                type="button"
                disabled={busy}
                onClick={() => goTo(index - 1)}
              >
                Back
              </button>
              {question.id !== 'review' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void advance(index, true)}
                >
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
          {preview}
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => goTo(index)}>
          Answer this question <span aria-hidden="true">↓</span>
        </button>
      )}
    </section>
  );
}
