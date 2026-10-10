import { useRef, useState } from 'react';
import type { Point } from '../../domain/product/finance';
import { addDays, daysBetween, formatDate } from '../../domain/product/dates';
import type { Entity } from './state';
import { money } from './state';
import s from './product.module.css';
export function FinancialChart({
  points,
  items = [],
  onMove,
  compact = false,
}: {
  points: Point[];
  items?: Entity<'purchase'>[];
  onMove?: (
    id: string,
    date: string,
    phase: 'preview' | 'commit' | 'cancel',
  ) => void;
  compact?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) return null;
  const first = points[0]!;
  const values = points.flatMap((p) => [
    p.baseline,
    p.cart,
    p.actual,
    p.low,
    0,
  ]);
  const min = Math.min(...values),
    max = Math.max(...values, 1),
    range = Math.max(100, max - min);
  const x = (i: number) => 50 + (i / (points.length - 1 || 1)) * 680;
  const y = (v: number) => 230 - ((v - min) / range) * 190;
  const path = (key: 'baseline' | 'cart' | 'actual' | 'low') =>
    points
      .map(
        (p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(p[key]).toFixed(2)}`,
      )
      .join(' ');
  const indexAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(
        points.length - 1,
        Math.round(
          ((((clientX - (rect?.left ?? 0)) / (rect?.width ?? 1)) * 760 - 50) /
            680) *
            (points.length - 1),
        ),
      ),
    );
  };
  return (
    <div>
      <svg
        ref={ref}
        className={`${s.chart} ${compact ? s.compactChart : ''}`}
        viewBox="0 0 760 270"
        role="img"
        aria-label="Financial projection: baseline, planned cart, and verified actual cash flow"
        onPointerMove={(e) => {
          const i = indexAt(e.clientX);
          setHover(i);
          if (drag) onMove?.(drag, addDays(first.date, i), 'preview');
        }}
        onPointerLeave={() => !drag && setHover(null)}
        onPointerUp={(e) => {
          if (drag)
            onMove?.(drag, addDays(first.date, indexAt(e.clientX)), 'commit');
          setDrag(null);
        }}
        onPointerCancel={() => {
          if (drag) onMove?.(drag, first.date, 'cancel');
          setDrag(null);
        }}
      >
        <rect
          x="50"
          y={Math.min(y(0), y(range * 0.05))}
          width="680"
          height={Math.abs(y(0) - y(range * 0.05))}
          fill="var(--color-surface-soft)"
        />
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1="50" x2="730" y1={230 - f * 190} y2={230 - f * 190} />
            <text x="2" y={234 - f * 190}>
              {new Intl.NumberFormat(undefined, {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format((min + range * f) / 100)}
            </text>
          </g>
        ))}
        <line x1="50" x2="730" y1={y(0)} y2={y(0)} strokeDasharray="4 3">
          <title>Zero balance</title>
        </line>
        {points.some((p) => p.low !== p.baseline) && (
          <path
            d={`${path('baseline')} ${points
              .slice()
              .reverse()
              .map((p, i) => `L${x(points.length - 1 - i)},${y(p.low)}`)
              .join(' ')} Z`}
            style={{ fill: 'var(--color-surface-soft)', stroke: 'none' }}
          />
        )}
        <path d={path('baseline')} className={s.baseline} />
        <path d={path('cart')} className={s.cart} />
        <path d={path('actual')} className={s.actual} />
        {[0, Math.floor((points.length - 1) / 2), points.length - 1].map(
          (i) => (
            <text key={i} x={x(i)} y="259" textAnchor="middle">
              {formatDate(points[i]!.date)}
            </text>
          ),
        )}
        {!compact &&
          items
            .filter(
              (i) =>
                i.data.status === 'planned' &&
                i.data.date >= first.date &&
                i.data.date <= points.at(-1)!.date,
            )
            .map((item) => {
              const i = daysBetween(first.date, item.data.date);
              return (
                <circle
                  key={item.id}
                  cx={x(i)}
                  cy={y(points[i]?.cart ?? 0)}
                  r="7"
                  tabIndex={0}
                  role="slider"
                  aria-label={`Move ${item.title} purchase date`}
                  aria-valuemin={0}
                  aria-valuemax={points.length - 1}
                  aria-valuenow={i}
                  aria-valuetext={item.data.date}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDrag(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      onMove?.(
                        item.id,
                        addDays(
                          first.date,
                          Math.max(
                            0,
                            Math.min(
                              points.length - 1,
                              i +
                                (e.key === 'ArrowRight' ? 1 : -1) *
                                  (e.shiftKey ? 14 : 1),
                            ),
                          ),
                        ),
                        'commit',
                      );
                    }
                  }}
                >
                  <title>
                    {item.title} · {money(item.data.costCents)} ·{' '}
                    {item.data.date}
                  </title>
                </circle>
              );
            })}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1="40" y2="230" />
        )}
      </svg>
      <div className={s.legend}>
        <span>Baseline income</span>
        <span>Planned cart</span>
        <span>Verified actual</span>
      </div>
      {hover !== null && (
        <p className={s.muted} role="status">
          {formatDate(points[hover]!.date)} · projected{' '}
          {money(points[hover]!.cart)}
        </p>
      )}
    </div>
  );
}
