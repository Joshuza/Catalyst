import type { Entity } from './state';
import { timeLabel } from '../../domain/product/dates';
import s from './product.module.css';
export function EventButton({
  event,
  onClick,
}: {
  event: Entity<'event'>;
  onClick: () => void;
}) {
  return (
    <div>
      {event.data.travelMinutes > 0 && (
        <p className={s.travel}>{event.data.travelMinutes} min travel</p>
      )}
      <button className={s.event} type="button" onClick={onClick}>
        {timeLabel(event.data.start)}
        <br />
        {event.title}
      </button>
    </div>
  );
}
