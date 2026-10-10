import type { DataOf } from '../../domain/product/model';
export type Stream = 'work' | 'personal' | 'promotional';
export function classify(
  sender: string,
  subject: string,
  body: string,
  rules: DataOf<'rule'>[],
  contacts: string[] = [],
): Stream {
  const learned = rules.find(
    (r) => r.sender.toLowerCase() === sender.toLowerCase(),
  );
  if (learned && learned.corrections >= 2) return learned.stream;
  if (contacts.some((c) => c.toLowerCase() === sender.toLowerCase()))
    return 'personal';
  if (
    /unsubscribe|sale|discount|% off|newsletter|promotion/i.test(
      `${subject} ${body}`,
    )
  )
    return 'promotional';
  if (
    /deadline|due|deliverable|client|repository|pull request|rubric|assignment|slack|report|review|proposal|submit|deliver|\bby (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i.test(
      `${subject} ${body}`,
    )
  )
    return 'work';
  return 'personal';
}
