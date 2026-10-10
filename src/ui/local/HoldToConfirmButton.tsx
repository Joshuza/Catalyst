import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './local.module.css';

export function HoldToConfirmButton({
  onConfirm,
  disabled = false,
  duration = 1600,
  resetAfter = 1800,
}: {
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  duration?: number;
  resetAfter?: number;
}) {
  const [status, setStatus] = useState<
    'idle' | 'holding' | 'saving' | 'confirmed' | 'error'
  >('idle');
  const active = useRef(false);
  const pointer = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const reset = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    if (active.current) setStatus('idle');
    active.current = false;
    pointer.current = null;
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      clearTimeout(reset.current);
    };
  }, []);
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled, cancel]);
  const start = (pointerId: number | null) => {
    if (
      disabled ||
      active.current ||
      status === 'saving' ||
      status === 'confirmed'
    )
      return;
    pointer.current = pointerId;
    active.current = true;
    setStatus('holding');
    timer.current = setTimeout(() => {
      if (!active.current) return;
      active.current = false;
      pointer.current = null;
      setStatus('saving');
      void onConfirm()
        .then(() => {
          if (!mounted.current) return;
          setStatus('confirmed');
          reset.current = setTimeout(() => {
            if (mounted.current) setStatus('idle');
          }, resetAfter);
        })
        .catch(() => {
          if (mounted.current) setStatus('error');
        });
    }, duration);
  };
  const label =
    status === 'confirmed'
      ? 'Deleted'
      : status === 'saving'
        ? 'Deleting'
        : status === 'error'
          ? 'Try holding again'
          : 'Hold to delete';
  return (
    <div>
      <button
        type="button"
        disabled={disabled || status === 'saving'}
        className={styles.hold}
        aria-label="Hold to delete. Hold Enter or Space for 1.6 seconds"
        aria-busy={status === 'saving'}
        onBlur={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(event) => {
          if (['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!event.repeat) start(null);
          }
        }}
        onKeyUp={(event) => {
          if (['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            cancel();
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          start(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!active.current || pointer.current !== event.pointerId) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left - 8 ||
            event.clientX > rect.right + 8 ||
            event.clientY < rect.top - 8 ||
            event.clientY > rect.bottom + 8
          )
            cancel();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
      >
        <span
          className={styles.holdFill}
          aria-hidden="true"
          style={{
            transform: status === 'holding' ? 'scaleX(1)' : 'scaleX(0)',
            transitionDuration: status === 'holding' ? `${duration}ms` : '0ms',
          }}
        />
        <span className={styles.holdLabel}>{label}</span>
      </button>
      <p className={styles.hint}>
        Hold Enter, Space, or the button for 1.6 seconds. Release to cancel.
      </p>
      <span role="status">
        {status === 'confirmed'
          ? 'Record deleted. Undo is available.'
          : status === 'error'
            ? 'Delete did not complete.'
            : ''}
      </span>
    </div>
  );
}
