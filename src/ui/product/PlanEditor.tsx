import { useState, type Dispatch, type SetStateAction } from 'react';
import { validateProposal } from '../../domain/product/tasks';
import { Field } from './Common';
import s from './product.module.css';
type Plan = { title: string; minutes: number }[];
export function PlanEditor({
  proposal,
  setProposal,
  sampleAi,
  onApprove,
  onError,
}: {
  proposal: Plan;
  setProposal: Dispatch<SetStateAction<Plan | null>>;
  sampleAi: boolean;
  onApprove: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [stepTitle, setStepTitle] = useState(''),
    [minutes, setMinutes] = useState(30),
    [json, setJson] = useState('');
  return (
    <div className={s.panel}>
      <h3>{sampleAi ? 'Sample proposed plan' : 'Manual plan'}</h3>
      <p className={s.muted}>
        Only the selected task’s content is shared. Edit the proposal; calendar
        events are created only after approval.
      </p>
      {proposal.map((p, i) => (
        <div className={s.row} key={i}>
          <Field label={`Step ${i + 1}`}>
            <input
              value={p.title}
              onChange={(e) =>
                setProposal(
                  (v) =>
                    v?.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    ) ?? null,
                )
              }
            />
          </Field>
          <Field label={`Step ${i + 1} minutes`}>
            <input
              type="number"
              min="5"
              max="480"
              value={p.minutes}
              onChange={(e) =>
                setProposal(
                  (v) =>
                    v?.map((x, j) =>
                      j === i ? { ...x, minutes: Number(e.target.value) } : x,
                    ) ?? null,
                )
              }
            />
          </Field>
          <button
            type="button"
            disabled={!i}
            onClick={() =>
              setProposal((v) => {
                if (!v) return null;
                const next = [...v];
                [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                return next;
              })
            }
          >
            Move up
          </button>
          <button
            type="button"
            onClick={() =>
              setProposal((v) => v?.filter((_, j) => j !== i) ?? null)
            }
          >
            Remove step
          </button>
        </div>
      ))}
      <div className={s.pair}>
        <Field label="New micro-task">
          <input
            value={stepTitle}
            onChange={(e) => setStepTitle(e.target.value)}
          />
        </Field>
        <Field label="Step duration">
          <input
            type="number"
            min="5"
            max="480"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </Field>
      </div>
      <button
        type="button"
        disabled={!stepTitle.trim()}
        onClick={() => {
          setProposal((v) => [...(v ?? []), { title: stepTitle, minutes }]);
          setStepTitle('');
        }}
      >
        Add step
      </button>
      <Field label="Paste AI plan JSON">
        <textarea value={json} onChange={(e) => setJson(e.target.value)} />
      </Field>
      <button
        type="button"
        onClick={() => {
          try {
            setProposal(validateProposal(JSON.parse(json) as unknown));
            onError('');
          } catch {
            onError(
              'Use an array of steps with title and minutes. Nothing was changed.',
            );
          }
        }}
      >
        Validate pasted plan
      </button>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={!proposal.length}
          onClick={() => void onApprove()}
        >
          Approve & schedule
        </button>
        <button type="button" onClick={() => setProposal(null)}>
          Reject plan
        </button>
      </div>
    </div>
  );
}
