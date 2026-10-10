import type { SurveyFieldsProps } from './FinancialFields';
import p from '../product/product.module.css';
import s from './onboarding.module.css';
const roles = [
  ['student', '01', 'Student', 'Essays, assignments, research, and rubrics.'],
  [
    'professional',
    '02',
    'Professional',
    'Deliverables, repositories, and team context.',
  ],
  ['hybrid', '03', 'Hybrid', 'A working life with room for learning.'],
] as const;
export function ScheduleFields({
  draft,
  patch,
  question,
}: SurveyFieldsProps & { question: string }) {
  if (question === 'persona')
    return (
      <fieldset>
        <legend>Primary persona</legend>
        <div className={s.roles}>
          {roles.map(([id, number, label, description]) => (
            <button
              key={id}
              type="button"
              aria-pressed={(draft.persona ?? 'hybrid') === id}
              onClick={() => patch({ persona: id })}
            >
              <span className={s.micro}>{number} / ROLE</span>
              <strong>{label}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      </fieldset>
    );
  return (
    <fieldset>
      <legend>Default calendar zoom</legend>
      <div className={p.chips}>
        {(
          [
            ['30m', '30m'],
            ['3h', '3h'],
            ['6h', '6h'],
            ['12h', '12h'],
            ['day', '1 Day'],
            ['week', 'Work Week'],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="calendar-zoom"
              checked={(draft.calendarZoom ?? 'week') === value}
              onChange={() => patch({ calendarZoom: value })}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
