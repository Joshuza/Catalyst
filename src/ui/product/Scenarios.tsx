import { useState } from 'react';
import { workspace } from '../local/runtime';
import { Panel, Field } from './Common';
import { entities, run } from './state';
import s from './product.module.css';
export function Scenarios({
  scenario,
  setScenario,
}: {
  scenario: string;
  setScenario: (value: string) => void;
}) {
  const [newScenario, setNewScenario] = useState('');
  const scenarios = entities('scenario'),
    items = entities('purchase');
  return (
    <Panel title="Compare a scenario">
      <Field label="New scenario name">
        <input
          value={newScenario}
          maxLength={100}
          onChange={(e) => setNewScenario(e.target.value)}
        />
      </Field>
      <button
        type="button"
        disabled={
          !newScenario.trim() ||
          newScenario === 'Main' ||
          scenarios.some((i) => i.data.name === newScenario)
        }
        onClick={() => {
          const name = newScenario.trim();
          run(
            workspace
              .commit('Create scenario', [
                workspace.make(name, {
                  type: 'scenario',
                  name,
                  payPercent:
                    scenarios.find((s) => s.data.name === scenario)?.data
                      .payPercent ?? 100,
                }),
                ...items
                  .filter(
                    (i) =>
                      i.data.scenario === scenario &&
                      i.data.status === 'planned',
                  )
                  .map((i) =>
                    workspace.make(i.title, {
                      ...i.data,
                      scenario: name,
                    }),
                  ),
              ])
              .then(() => {
                setScenario(name);
                setNewScenario('');
              }),
          );
        }}
      >
        Duplicate current plan
      </button>
      {scenarios.map((v) => (
        <div className={s.row} key={v.id}>
          <span>{v.data.name}</span>
          <button
            type="button"
            onClick={() => {
              const now = workspace.clock.now().toISOString();
              run(
                workspace.commit(
                  'Delete scenario',
                  [
                    v,
                    ...items.filter((i) => i.data.scenario === v.data.name),
                  ].map((r) => ({
                    ...r,
                    deletedAt: now,
                  })),
                ),
              );
              setScenario('Main');
            }}
          >
            Delete scenario
          </button>
        </div>
      ))}
    </Panel>
  );
}
