import { useEffect, useState } from 'react';
import { classify, type Stream } from '../../engine/product/classifier';
import { parseCommand } from '../../engine/product/terminal';
import { semanticTags } from '../../domain/product/evolution';
import { emptyTaskDetails } from '../../domain/product/model';
import { daysBetween } from '../../domain/product/dates';
import { recordSchema, type UserRecord } from '../../domain/records';
import { workspace } from '../local/runtime';
import { Page, Panel, Field } from './Common';
import { useProduct, entities, run, navigate } from './state';
import s from './product.module.css';
const streams: Stream[] = ['work', 'personal', 'promotional'];
export function InboxPage() {
  const { today, profile, records } = useProduct();
  const [stream, setStream] = useState<Stream>('work'),
    [sender, setSender] = useState(''),
    [subject, setSubject] = useState(''),
    [body, setBody] = useState(''),
    [error, setError] = useState('');
  const messages = records.filter(
    (r): r is Extract<UserRecord, { kind: 'message' }> =>
      r.kind === 'message' && !r.deletedAt && !r.archived,
  );
  const { deep } = useProduct();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest('input,textarea,select') ||
        document.querySelector('dialog[open]')
      )
        return;
      const selected = streams[Number(e.key) - 1];
      if (selected) setStream(selected);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const importMessage = async (text?: string) => {
    try {
      let from = sender,
        title = subject,
        content = body;
      if (text) {
        const lines = text.split(/\r?\n/);
        from =
          lines.find((l) => /^From:/i.test(l))?.replace(/^From:\s*/i, '') ??
          'Imported sender';
        title =
          lines
            .find((l) => /^Subject:/i.test(l))
            ?.replace(/^Subject:\s*/i, '') ?? 'Imported message';
        content = text.slice(0, 20000);
      }
      if (!from.trim() || !title.trim())
        throw new Error('Enter a sender and subject.');
      const classified = classify(
        from,
        title,
        content,
        entities('rule').map((r) => r.data),
        entities('contact').map((c) => c.title),
      );
      const message = recordSchema.parse({
        ...workspace.draft('note'),
        kind: 'message',
        title,
        body: content,
        sender: from,
        date: today,
        stream: classified,
        unread: true,
        archived: false,
        replyNeeded: /\?|please|could you|can you/i.test(content),
      });
      const changes: UserRecord[] = [message];
      if (classified === 'work' && /\b(?:due|by|deadline)\b/i.test(content)) {
        const parsed = parseCommand(
          `finish ${title} by ${content}`,
          today,
          profile,
        );
        if (!parsed.question) {
          const task = {
            ...workspace.draft('task'),
            title,
            details: {
              ...emptyTaskDetails(),
              deadline: parsed.date,
              conversation: `${from}: ${content}`,
            },
          };
          changes.push(task);
          if (message.kind === 'message') message.taskId = task.id;
        }
      }
      await workspace.commit('Message imported', changes);
      setSender('');
      setSubject('');
      setBody('');
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The message could not be imported.',
      );
    }
  };
  const correct = (
    message: Extract<UserRecord, { kind: 'message' }>,
    value: Stream,
  ) => {
    const rule = entities('rule').find(
      (r) => r.data.sender.toLowerCase() === message.sender.toLowerCase(),
    );
    const data = {
      type: 'rule' as const,
      sender: message.sender,
      stream: value,
      corrections: rule?.data.stream === value ? rule.data.corrections + 1 : 1,
    };
    run(
      workspace.commit('Inbox sorting corrected', [
        { ...message, stream: value },
        rule
          ? { ...rule, data }
          : workspace.make(`Sender preference: ${message.sender}`, data),
      ]),
    );
  };
  return (
    <Page
      title="Tri-fold inbox"
      subtitle="Work, personal, and promotional messages stay separate. Sorting corrections are learned on this device."
    >
      <div className={s.chips}>
        {streams
          .filter((v) => !deep || v !== 'promotional')
          .map((v, i) => (
            <button
              key={v}
              type="button"
              aria-pressed={stream === v}
              onClick={() => setStream(v)}
            >
              {i + 1} ·{' '}
              {v === 'promotional'
                ? 'Promo'
                : v === 'work'
                  ? 'Work'
                  : 'Personal'}{' '}
              ({messages.filter((m) => m.stream === v && m.unread).length})
            </button>
          ))}
      </div>
      {deep && (
        <p className={s.alert}>
          Deep work ·{' '}
          {
            messages.filter((m) => m.unread && m.stream !== 'promotional')
              .length
          }{' '}
          unread messages. Promotional messages are suppressed.
        </p>
      )}
      <div className={s.grid}>
        <Panel title="Messages" wide>
          {stream === 'promotional' && !deep && (
            <button
              type="button"
              onClick={() =>
                run(
                  workspace.commit(
                    'Promotional messages archived',
                    messages
                      .filter((m) => m.stream === 'promotional')
                      .map((m) => ({ ...m, archived: true, unread: false })),
                  ),
                )
              }
            >
              Archive all Promo
            </button>
          )}
          {messages
            .filter(
              (m) =>
                m.stream === stream && (!deep || m.stream !== 'promotional'),
            )
            .map((m) => {
              const contact = entities('contact').find(
                (c) => c.title.toLowerCase() === m.sender.toLowerCase(),
              );
              return (
                <details key={m.id} className={s.panel}>
                  <summary>
                    {m.unread ? 'Unread · ' : ''}
                    {m.title} · {m.sender}
                    {m.replyNeeded ? ' · Reply needed' : ''}
                  </summary>
                  <p className={s.note}>{m.body}</p>
                  {contact &&
                    daysBetween(contact.data.lastContact, today) >
                      contact.data.rhythmDays && (
                      <p className={s.muted}>
                        A check-in with {contact.title} is due.
                      </p>
                    )}
                  <div className={s.actions}>
                    <button
                      type="button"
                      onClick={() =>
                        run(workspace.save({ ...m, unread: !m.unread }))
                      }
                    >
                      {m.unread ? 'Mark read' : 'Mark unread'}
                    </button>
                    <Field label={`Move ${m.title} to stream`}>
                      <select
                        value={m.stream}
                        onChange={(e) => correct(m, e.target.value as Stream)}
                      >
                        {streams.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    {m.taskId && (
                      <button type="button" onClick={() => navigate('tasks')}>
                        Open linked task
                      </button>
                    )}
                    {m.stream === 'promotional' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            workspace.commit('Message saved to research', [
                              {
                                ...workspace.draft('note'),
                                title: m.title,
                                body: `${m.sender}\n${m.body}`,
                              },
                              workspace.make(m.title, {
                                type: 'research',
                                url: '',
                                body: `${m.sender}\n${m.body}`,
                                image: '',
                                tags: semanticTags(m.title, m.body),
                                priority: 'Researching',
                                pros: '',
                                cons: '',
                                costCents: 0,
                                purchaseId: null,
                              }),
                            ]),
                          )
                        }
                      >
                        Save to research vault
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          workspace.save({
                            ...m,
                            archived: true,
                            unread: false,
                          }),
                        )
                      }
                    >
                      Archive
                    </button>
                  </div>
                </details>
              );
            })}
          {!messages.some((m) => m.stream === stream) && (
            <p className={s.empty}>
              This stream is clear. Import a message below to start sorting.
            </p>
          )}
        </Panel>
        <Panel title="Add a message">
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void importMessage();
            }}
          >
            <Field label="Message sender">
              <input
                value={sender}
                maxLength={300}
                onChange={(e) => setSender(e.target.value)}
              />
            </Field>
            <Field label="Message subject">
              <input
                value={subject}
                maxLength={300}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field label="Message body">
              <textarea
                value={body}
                maxLength={20000}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <button type="submit" className={s.primary}>
              Import message
            </button>
            <Field label="Import EML or text">
              <input
                type="file"
                accept=".eml,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size <= 1024 * 1024)
                    void f.text().then((text) => importMessage(text));
                  else setError('Choose a message file under 1 MB.');
                  e.target.value = '';
                }}
              />
            </Field>
            {error && <p role="alert">{error}</p>}
          </form>
        </Panel>
        <Panel title="Sorting memory">
          {entities('rule').map((r) => (
            <p key={r.id}>
              {r.data.sender} → {r.data.stream} · {r.data.corrections}{' '}
              correction
              {r.data.corrections === 1 ? '' : 's'}
            </p>
          ))}
          <p className={s.muted}>
            Two corrections to the same stream make a sender preference
            permanent until you change it. Message content is rendered as text.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
