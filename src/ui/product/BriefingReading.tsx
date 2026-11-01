import type { ReactNode } from 'react';
import type { WidgetSize } from '../../domain/product/widgets';
import type { Entity } from './state';
import { Panel } from './Common';
import { openWidget } from './widget-catalog';
import s from './product.module.css';

export function BriefingReading({
  reading,
  size,
  controls,
}: {
  reading: Entity<'news'>[];
  size: WidgetSize;
  controls: ReactNode;
}) {
  return (
    <Panel title="Three things to read" widget="reading" size={size}>
      {reading.map((item) => (
        <div className={s.row} key={item.id}>
          <div>
            <a
              href={item.data.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
            <p className={s.reading}>
              {item.data.source} · {item.data.minutes} min read
            </p>
          </div>
        </div>
      ))}
      {!reading.length && (
        <p className={s.empty}>
          Your reading queue is clear. Add a source or article in Reading.
        </p>
      )}
      <button type="button" onClick={() => openWidget('reading')}>
        Open Reading
      </button>
      {controls}
    </Panel>
  );
}
