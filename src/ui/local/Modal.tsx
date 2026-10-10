import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './local.module.css';

export function Modal({
  title,
  onClose,
  children,
  required = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  required?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    const initial =
      ref.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea',
      ) ?? ref.current?.querySelector<HTMLElement>('button');
    initial?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
      else
        document
          .querySelector<HTMLElement>('[data-workspace-trigger]')
          ?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      data-required={required}
      className={styles.modal}
      aria-labelledby={heading}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, input, textarea, select, a[href], [tabindex]',
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.hasAttribute('disabled') &&
            element.getClientRects().length > 0,
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!required) onClose();
      }}
    >
      <div className={styles.modalHeader}>
        <h2 id={heading}>{title}</h2>
        {!required && (
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
            Close
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
