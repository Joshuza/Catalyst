import { useState } from 'react';
import type { SurveyFieldsProps } from './FinancialFields';
import { Field, ToggleSet } from '../product/Common';
import s from '../product/product.module.css';
const sources = [
  'Substack',
  'NYT',
  'MSNBC',
  'The Verge',
  'Vox',
  'F1.com',
  'BBC',
  'NPR',
  'Reuters',
  'Financial Times',
  'Wired',
  'Nature',
  'The Atlantic',
  'The Guardian',
  'Ars Technica',
  'Science',
  'The Economist',
  'AP',
  'Bloomberg',
  'MIT Technology Review',
  'National Geographic',
];
const topics = [
  'Tech',
  'Finance',
  'Design',
  'Science',
  'Culture',
  'World news',
  'Motorsport',
  'Food',
  'Outdoors',
];
export function LifestyleFields({
  draft,
  patch,
  question,
}: SurveyFieldsProps & { question: string }) {
  const [query, setQuery] = useState('');
  if (question === 'reset')
    return (
      <Field label="Weekly reset day">
        <select
          value={draft.resetDay}
          onChange={(e) => patch({ resetDay: Number(e.target.value) })}
        >
          {[
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ].map((day, i) => (
            <option key={day} value={i}>
              {day}
            </option>
          ))}
        </select>
      </Field>
    );
  if (question === 'topics')
    return (
      <>
        <ToggleSet
          label="Reading interests"
          options={topics}
          values={draft.mediaTopics ?? []}
          onChange={(mediaTopics) => patch({ mediaTopics })}
        />
        <Field label="Morning digest time">
          <input
            type="time"
            value={draft.digestTime ?? '07:00'}
            onChange={(e) => patch({ digestTime: e.target.value })}
          />
        </Field>
        <p className={s.muted}>
          Your selections prioritize imported reading. Scheduled background
          delivery needs a connected feed service.
        </p>
      </>
    );
  return (
    <>
      <Field label="Search publications or paste a link">
        <input
          type="search"
          value={query}
          maxLength={300}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <ToggleSet
        label="Followed publications"
        options={[
          ...new Set([
            ...sources.filter((name) =>
              name.toLowerCase().includes(query.toLowerCase()),
            ),
            ...draft.feeds,
          ]),
        ]}
        values={draft.feeds}
        onChange={(feeds) => patch({ feeds })}
      />
      <button
        type="button"
        disabled={
          !query.trim() ||
          draft.feeds.includes(query.trim()) ||
          draft.feeds.length >= 50
        }
        onClick={() => {
          patch({ feeds: [...draft.feeds, query.trim()] });
          setQuery('');
        }}
      >
        Add this source
      </button>
      <p className={s.muted}>
        No account connection is needed. Names and URLs are saved locally.
      </p>
    </>
  );
}
