import { useEffect, useRef, useState } from 'react';
import type { Point } from '../../domain/product/finance';
import { addDays, daysBetween, formatDate } from '../../domain/product/dates';
import type { Entity } from './state';
import { money } from './state';
import s from './product.module.css';
import { stepLine } from './chart-geometry';
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
  const [compactWidth, setCompactWidth] = useState(760);
  useEffect(() => {
    if (!compact || !ref.current) return;
    const svg = ref.current;
    const measure = () =>
      setCompactWidth(
        Math.max(300, Math.min(760, Math.round(svg.clientWidth))),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [compact, points.length]);
  if (!points.length) return null;
  const width = compact ? compactWidth : 760;
  const height = compact ? 140 : 270;
  const top = compact ? 12 : 40;
  const bottom = height - 40;
  const plotHeight = bottom - top;
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
  const x = (i: number) => 50 + (i / (points.length - 1 || 1)) * (width - 80);
  const y = (v: number) => bottom - ((v - min) / range) * plotHeight;
  const path = (key: 'baseline' | 'cart' | 'actual' | 'low', reverse = false) =>
    stepLine(
      points.map((p) => p[key]),
      x,
      y,
      reverse,
    );
  const indexAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    const transform = ref.current?.getScreenCTM();
    const localX = transform
      ? new DOMPoint(clientX, 0).matrixTransform(transform.inverse()).x
      : ((clientX - (rect?.left ?? 0)) / (rect?.width ?? 1)) * width;
    return Math.max(
      0,
      Math.min(
        points.length - 1,
        Math.round(((localX - 50) / (width - 80)) * (points.length - 1)),
      ),
    );
  };
  return (
    <div className={s.financialPlot}>
      <svg
        ref={ref}
        className={`${s.chart} ${compact ? s.compactChart : ''}`}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Financial projection: baseline, planned cart, and verified actual cash flow"
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            e.target !== e.currentTarget ||
            !['ArrowLeft', 'ArrowRight'].includes(e.key)
          )
            return;
          e.preventDefault();
          setHover((current) =>
            Math.max(
              0,
              Math.min(
                points.length - 1,
                (current ?? 0) + (e.key === 'ArrowRight' ? 1 : -1),
              ),
            ),
          );
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHover(null);
        }}
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
          width={width - 80}
          height={Math.abs(y(0) - y(range * 0.05))}
          fill="var(--color-chart-warning)"
        />
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="50"
              x2={width - 30}
              y1={bottom - f * plotHeight}
              y2={bottom - f * plotHeight}
            />
            <text x="2" y={bottom + 4 - f * plotHeight}>
              {new Intl.NumberFormat(undefined, {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format((min + range * f) / 100)}
            </text>
          </g>
        ))}
        <line x1="50" x2={width - 30} y1={y(0)} y2={y(0)} strokeDasharray="4 3">
          <title>Zero balance</title>
        </line>
        {points.some((p) => p.low !== p.baseline) && (
          <path
            d={`${path('baseline')} ${path('low', true).replace(/^M/, 'L')} Z`}
            style={{ fill: 'var(--color-surface-soft)', stroke: 'none' }}
          />
        )}
        <path data-series="actual" d={path('actual')} className={s.actual} />
        <path
          data-series="baseline"
          d={path('baseline')}
          className={s.baseline}
        />
        <path data-series="cart" d={path('cart')} className={s.cart} />
        {[0, Math.floor((points.length - 1) / 2), points.length - 1].map(
          (i) => (
            <text key={i} x={x(i)} y={height - 11} textAnchor="middle">
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
          <line
            pointerEvents="none"
            x1={x(hover)}
            x2={x(hover)}
            y1={top}
            y2={bottom}
          />
        )}
      </svg>
      <div className={s.legend}>
        <span>Baseline income</span>
        <span title="Projected balance including scheduled bills and purchases still in your cart. Recorded purchases stay in the balance.">
          Cart (not bought)
        </span>
        <span>Verified actual</span>
      </div>
      {hover !== null && (
        <p className={s.muted} role="status">
          {formatDate(points[hover]!.date)} · baseline{' '}
          {money(points[hover]!.baseline)} · cart {money(points[hover]!.cart)} ·
          actual {money(points[hover]!.actual)}
        </p>
      )}
    </div>
  );
}
