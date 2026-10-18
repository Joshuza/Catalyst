import s from './product.module.css';
export function WidgetIcon({ kind }: { kind: 'money' | 'schedule' | 'inbox' }) {
  const paths = {
    money: 'M4 17V7h16v10H4Zm4-5h8M8 4h8M8 20h8',
    schedule: 'M5 5h14v15H5V5Zm0 5h14M8 3v4m8-4v4M8 13h2m4 0h2M8 17h2',
    inbox: 'M4 14 7 5h10l3 9v5H4v-5Zm0 0h5l1 2h4l1-2h5',
  };
  return (
    <span className={s.widgetIcon} data-kind={kind} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[kind]} />
      </svg>
    </span>
  );
}
