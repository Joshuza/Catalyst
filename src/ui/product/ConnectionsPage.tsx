import { useState } from 'react';
import { productSamples } from '../../fixtures/product';
import { workspace } from '../local/runtime';
import { Page, Panel } from './Common';
import { useProduct, run, navigate } from './state';
import s from './product.module.css';
export function ConnectionsPage() {
  const { profile } = useProduct();
  const [status, setStatus] = useState('');
  return (
    <Page
      title="Connections & privacy"
      subtitle="Local tools work without an account. External services are optional and never connected silently."
    >
      <div className={s.grid}>
        <Panel title="A complete sample workspace">
          <p>
            Explore finance, calendar, recipes, transit, hikes, contacts, and
            reading using clearly labeled Sample records.
          </p>
          <p className={s.muted}>
            The sample profile is used only when you have not saved your own
            profile. Your personal records are preserved.
          </p>
          <button
            type="button"
            onClick={() => {
              const data = productSamples(workspace.clock).filter(
                (r) => r.kind !== 'settings' || !profile.completed,
              );
              run(
                workspace
                  .commit('Sample workspace loaded', data)
                  .then(() =>
                    setStatus(
                      'Sample workspace loaded. Remove all Sample data from Notes & records when finished.',
                    ),
                  ),
              );
            }}
          >
            Load product sample data
          </button>
          <p role="status">{status}</p>
        </Panel>
        <Panel title="Local integration hub">
          <div className={s.row}>
            <div>
              <strong>Banking</strong>
              <p className={s.muted}>
                Manual transactions and validated backups.
              </p>
            </div>
            <button type="button" onClick={() => navigate('records')}>
              Open records
            </button>
          </div>
          <div className={s.row}>
            <div>
              <strong>Mail & chat</strong>
              <p className={s.muted}>Manual entry and EML/text file import.</p>
            </div>
            <button type="button" onClick={() => navigate('inbox')}>
              Import messages
            </button>
          </div>
          <div className={s.row}>
            <div>
              <strong>Personal AI</strong>
              <p className={s.muted}>
                Copy a selected task’s prompt, paste a plan, or use the labeled
                Sample provider.
              </p>
            </div>
            <button type="button" onClick={() => navigate('tasks')}>
              Open Small Steps
            </button>
          </div>
          <div className={s.row}>
            <div>
              <strong>Maps, weather & trails</strong>
              <p className={s.muted}>Manual data and Sample providers.</p>
            </div>
            <button type="button" onClick={() => navigate('transit')}>
              Open routes
            </button>
          </div>
          <div className={s.row}>
            <div>
              <strong>Screen time</strong>
              <p className={s.muted}>CSV import and manual samples.</p>
            </div>
            <button type="button" onClick={() => navigate('screen')}>
              Import samples
            </button>
          </div>
        </Panel>
        <Panel title="Your data stays here" wide>
          <p>
            Financial records, receipts, messages, contacts, pet care, and
            screen-time data are encrypted in IndexedDB with a non-extractable
            device key. Notes, task context, and recipe content remain local.
            Search is rebuilt in memory and never written to disk.
          </p>
          <p className={s.muted}>
            Encryption does not protect an unlocked browser or malicious
            same-origin code. JSON backups are readable exports; store them
            privately. Live Plaid, mail, maps, cloud sync, and real AI API
            connections are outside the ZIP’s v1 scope.
          </p>
          <button type="button" onClick={() => navigate('records')}>
            Back up or restore your data
          </button>
        </Panel>
      </div>
    </Page>
  );
}
