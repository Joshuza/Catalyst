import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../../domain/product/profile';
import { resolvedSurveyQuestions } from './resolve-skipped';
import { questions } from './steps';
describe('ONB-02 / ONB-04: resolved setup prompts', () => {
  it('resolves only the income prompt when its amount changes, preserving unanswered deposit and cadence questions', () => {
    const before = defaultProfile('2026-01-01');
    const after = { ...before, pay: { ...before.pay, amountCents: 450000 } };
    expect(resolvedSurveyQuestions(before, after)).toEqual([
      questions.find((q) => q.id === 'pay')?.title,
    ]);
    expect(resolvedSurveyQuestions(before, before)).toEqual([]);
  });
  it('resolves calendar, pet, and topic prompts after changes in preferences', () => {
    const before = defaultProfile('2026-01-01');
    const after = {
      ...before,
      calendarZoom: '6h' as const,
      petFoodDays: 21,
      mediaTopics: ['Finance'],
    };
    const resolved = resolvedSurveyQuestions(before, after);
    expect(resolved).toHaveLength(3);
    for (const id of ['zoom', 'pet', 'topics'])
      expect(resolved).toContain(questions.find((q) => q.id === id)?.title);
  });
});
