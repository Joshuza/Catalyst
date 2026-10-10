import { Modal } from '../local/Modal';
import { Ticket } from './Animations';
import { timeLabel } from '../../domain/product/dates';
import { DeleteRecord } from './Common';
import type { Entity } from './state';
import s from './product.module.css';
export function CalendarEventDetails({
  event,
  onClose,
  onEdit,
}: {
  event: Entity<'event'>;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal title={event.title} onClose={onClose}>
      <div className={s.page}>
        <p>
          {event.data.date} · {timeLabel(event.data.start)} ·{' '}
          {event.data.minutes} minutes
        </p>
        {event.data.ticket !== 'none' && <Ticket event={event} />}
        <button type="button" onClick={onEdit}>
          Edit or move event
        </button>
        <DeleteRecord record={event} />
      </div>
    </Modal>
  );
}
