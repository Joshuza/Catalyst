import { type ReactNode } from 'react';
import { Icon } from './icons';
import { initialPresentation, useCanvasStore } from './store';
import styles from './canvas.module.css';

export type TileProps = {
  id: string;
  title: string;
  label: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
};

export function Tile({
  id,
  title,
  label,
  description,
  children,
  wide = false,
}: TileProps) {
  const { expanded, dimmed } = useCanvasStore(
    (state) => state.tiles[id] ?? initialPresentation,
  );
  const toggle = useCanvasStore((state) => state.toggle);
  const state = expanded ? 'expanded' : 'collapsed';
  return (
    <article
      className={`${styles.tile} ${wide ? styles.wide : ''}`}
      data-state={state}
      data-dimmed={dimmed}
      aria-labelledby={`${id}-title`}
    >
      <header className={styles.tileHeader}>
        <span className={styles.eyebrow}>{label}</span>
        <span className={styles.sample}>Sample</span>
      </header>
      <h2 id={`${id}-title`}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.placeholder} aria-hidden="true">
        {children}
      </div>
      <div id={`${id}-details`} hidden={!expanded} className={styles.details}>
        <p>
          This is a sample tile. Product modules will be added in later phases.
        </p>
      </div>
      <footer className={styles.tileFooter}>
        <button
          className={styles.textButton}
          aria-expanded={expanded}
          aria-controls={`${id}-details`}
          onClick={() => toggle(id, 'expanded')}
        >
          {expanded ? 'Collapse tile' : 'Expand tile'}
          <Icon name={expanded ? 'minus' : 'arrow'} />
        </button>
        <button
          className={styles.iconButton}
          aria-label={`${dimmed ? 'Restore' : 'Dim'} ${title}`}
          aria-pressed={dimmed}
          onClick={() => toggle(id, 'dimmed')}
        >
          <Icon name="sun" />
        </button>
      </footer>
    </article>
  );
}
