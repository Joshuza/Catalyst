import type { UserRecord } from '../../domain/records';
import type { TaskDetails } from '../../domain/product/model';
import { Field, DeleteRecord } from './Common';
import { run } from './state';
import s from './product.module.css';
export function TaskSettings({
  task,
  details,
  update,
}: {
  task: Extract<UserRecord, { kind: 'task' }>;
  details: TaskDetails;
  update: (p: Partial<TaskDetails>) => Promise<unknown>;
}) {
  return (
    <details>
      <summary>Task settings</summary>{' '}
      <div className={s.pair}>
        <Field label={`Deadline for ${task.title}`}>
          <input
            type="date"
            value={details.deadline ?? ''}
            onChange={(e) => run(update({ deadline: e.target.value || null }))}
          />
        </Field>
        <Field label={`Role for ${task.title}`}>
          <select
            value={details.role}
            onChange={(e) =>
              run(update({ role: e.target.value as TaskDetails['role'] }))
            }
          >
            {['personal', 'student', 'professional'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <DeleteRecord record={task} />
    </details>
  );
}
