import s from './onboarding.module.css';

/** Original nectarine emblem; no Pear wordmark or external assets. */
export function NectarineMark() {
  return (
    <svg className={s.nectarineMark} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 16C12 7 4 19 8 31c3 10 12 13 16 10 5 3 14-1 17-11 4-12-5-21-17-14Z" />
      <path d="M24 16c2 7 3 14 0 22M24 15c-2-6 1-11 5-13M26 11c8 1 12-2 14-7-8-1-12 2-14 7Z" />
    </svg>
  );
}

/** The uploaded reference uses ruled frames and four-point corner ornaments. */
export function ArtFrame() {
  return (
    <div className={s.artFrame} aria-hidden="true">
      {['topLeft', 'bottomRight'].map((corner) => (
        <svg key={corner} data-corner={corner} viewBox="0 0 24 24">
          <path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z" />
        </svg>
      ))}
    </div>
  );
}
