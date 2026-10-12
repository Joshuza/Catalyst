import { useEffect, useRef, useState, type ReactNode } from 'react';
import { money } from './state';
import a from './animations.module.css';
import type { Entity } from './state';
export function ReceiptPrinter({
  title,
  cents,
  planned = false,
  currency,
}: {
  title: string;
  cents: number;
  planned?: boolean;
  currency?: string;
}) {
  const [stage, setStage] = useState<'processing' | 'printing' | 'complete'>(
    'processing',
  );
  useEffect(() => {
    const start = setTimeout(() => setStage('printing'), 250),
      end = setTimeout(() => setStage('complete'), 2000);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [title, cents]);
  return (
    <section
      className={a.printer}
      aria-label="Receipt printer"
      data-stage={stage}
    >
      <div className={a.machine}>
        <strong>CATALYST / RECEIPT</strong>
        <div className={a.screen} role="status">
          {stage === 'processing'
            ? planned
              ? 'Saving your plan'
              : 'Saving your purchase'
            : stage === 'printing'
              ? 'Printing your receipt'
              : planned
                ? 'Purchase planned'
                : 'Purchase recorded'}
        </div>
        <div className={a.slot} />
      </div>
      <div className={a.output}>
        <article
          className={a.paper}
          data-stage={stage}
          aria-hidden={stage !== 'complete'}
        >
          <p>CATALYST</p>
          <hr />
          <p>{title}</p>
          <p>{money(cents, currency)}</p>
          <hr />
          <p>{planned ? 'PLANNED PURCHASE' : 'VERIFIED PURCHASE'}</p>
          <p>
            {planned
              ? 'Your cart projection has updated.'
              : 'Your actual cash flow has updated.'}
          </p>
        </article>
      </div>
    </section>
  );
}
export function Ticket({ event }: { event: Entity<'event'> }) {
  return (
    <article
      aria-label={`Ticket reminder for ${event.title}`}
      className={a.ticket}
      onPointerMove={(e) => {
        if (
          !matchMedia(
            '(hover:hover) and (prefers-reduced-motion:no-preference)',
          ).matches
        )
          return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          '--tilt-x',
          `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`,
        );
        e.currentTarget.style.setProperty(
          '--tilt-y',
          `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`,
        );
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty('--tilt-x', '0deg');
        e.currentTarget.style.setProperty('--tilt-y', '0deg');
      }}
    >
      <p>{event.data.ticket.toUpperCase()} REMINDER</p>
      <h3>{event.title}</h3>
      <p>{event.data.date}</p>
      <p>{event.data.location}</p>
      <div className={a.stub}>
        {event.data.reference || 'Personal reminder. No ticket issued.'}
        {event.data.ticketUrl && (
          <a
            href={event.data.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original ticket
          </a>
        )}
      </div>
    </article>
  );
}
export function ChoiceDeck({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const suits = ['♠', '♥', '♣', '♦'];
  return (
    <div className={a.deck} aria-label="Choose an activity">
      {options.map((value, i) => (
        <button
          key={value}
          type="button"
          className={a.card}
          style={
            {
              '--card-angle': `${(i - (options.length - 1) / 2) * 3}deg`,
            } as React.CSSProperties
          }
          aria-pressed={selected === value}
          onClick={() => onSelect(value)}
        >
          <span className={a.rank}>
            {i === 0 ? 'A' : i + 1} {suits[i % 4]}
          </span>
          <span>
            <span className={a.suit} aria-hidden="true">
              {suits[i % 4]}
            </span>
            <br />
            {value}
          </span>
        </button>
      ))}
    </div>
  );
}
export function MagneticDropZone({
  onFiles,
  accept = '.pdf,.png,.jpg,.jpeg,.txt',
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const handle = (files: File[]) => {
    const invalid = files.find(
      (f) =>
        f.size > 20 * 1024 * 1024 ||
        !['application/pdf', 'image/png', 'image/jpeg', 'text/plain'].includes(
          f.type,
        ),
    );
    if (invalid) {
      setError(`${invalid.name}: choose PDF, PNG, JPEG, or text up to 20 MB.`);
      return;
    }
    setError('');
    onFiles(files);
  };
  useEffect(() => {
    const reset = () => {
      setOver(false);
      ref.current?.style.setProperty('--magnet-x', '0px');
      ref.current?.style.setProperty('--magnet-y', '0px');
    };
    const move = (e: DragEvent) => {
      if (
        !e.dataTransfer?.types.includes('Files') ||
        !ref.current ||
        matchMedia('(prefers-reduced-motion:reduce)').matches
      )
        return;
      const r = ref.current.getBoundingClientRect(),
        dx = e.clientX - r.left - r.width / 2,
        dy = e.clientY - r.top - r.height / 2;
      const d = Math.hypot(
        Math.max(0, Math.abs(dx) - r.width / 2),
        Math.max(0, Math.abs(dy) - r.height / 2),
      );
      const near = Math.max(0, 1 - d / 180);
      ref.current.style.setProperty(
        '--magnet-x',
        `${Math.sign(dx) * near * 8}px`,
      );
      ref.current.style.setProperty(
        '--magnet-y',
        `${Math.sign(dy) * near * 8}px`,
      );
    };
    window.addEventListener('dragover', move);
    window.addEventListener('drop', reset);
    window.addEventListener('dragend', reset);
    return () => {
      window.removeEventListener('dragover', move);
      window.removeEventListener('drop', reset);
      window.removeEventListener('dragend', reset);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={a.drop}
      data-over={over}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(Array.from(e.dataTransfer.files));
      }}
    >
      <div>
        <button type="button" onClick={() => input.current?.click()}>
          {over ? 'Let go to add receipts' : 'Drop receipts here or browse'}
        </button>
        <p>PDF, PNG, JPEG, or text · up to 20 MB each</p>
        <input
          ref={input}
          aria-label="Receipt files"
          type="file"
          hidden
          multiple
          accept={accept}
          onChange={(e) => {
            handle(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        {children}
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
