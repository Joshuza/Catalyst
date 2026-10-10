import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import styles from './local.module.css';

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  children: string;
  icon?: ReactNode;
  stateKey?: string;
  variant?: 'primary' | 'secondary';
  width?: 'content' | 'full';
};
export const DynamicButton = forwardRef<HTMLButtonElement, Props>(
  function DynamicButton(
    {
      children,
      icon,
      stateKey,
      variant = 'primary',
      width = 'content',
      className = '',
      ...props
    },
    forwardedRef,
  ) {
    const button = useRef<HTMLButtonElement>(null);
    const measure = useRef<HTMLSpanElement>(null);
    const [measuredWidth, setMeasuredWidth] = useState<number>();
    const previous = useRef({ children, icon, stateKey });
    const [outgoing, setOutgoing] = useState<typeof previous.current | null>(
      null,
    );
    useEffect(() => {
      if (
        previous.current.children === children &&
        previous.current.icon === icon &&
        previous.current.stateKey === stateKey
      )
        return;
      setOutgoing(previous.current);
      previous.current = { children, icon, stateKey };
      const timer = setTimeout(() => setOutgoing(null), 180);
      return () => clearTimeout(timer);
    }, [children, icon, stateKey]);
    useImperativeHandle(
      forwardedRef,
      () => button.current as HTMLButtonElement,
    );
    useLayoutEffect(() => {
      const target = measure.current;
      if (!target || width === 'full') return;
      const sync = () => {
        if (!button.current) return;
        const css = getComputedStyle(button.current);
        setMeasuredWidth(
          Math.ceil(
            target.scrollWidth +
              (parseFloat(css.paddingLeft) || 0) +
              (parseFloat(css.paddingRight) || 0) +
              (parseFloat(css.borderLeftWidth) || 0) +
              (parseFloat(css.borderRightWidth) || 0),
          ),
        );
      };
      sync();
      const observer =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
      observer?.observe(target);
      window.addEventListener('resize', sync);
      return () => {
        observer?.disconnect();
        window.removeEventListener('resize', sync);
      };
    }, [children, icon, width, className, variant]);
    return (
      <button
        {...props}
        ref={button}
        type={props.type ?? 'button'}
        className={`${styles.dynamic} ${variant === 'primary' ? styles.primary : ''} ${className}`}
        style={{
          width: width === 'full' ? '100%' : measuredWidth,
          ...props.style,
        }}
      >
        <span key={stateKey ?? children} className={styles.dynamicLabel}>
          {icon}
          {children}
        </span>
        {outgoing && (
          <span
            key={`out-${outgoing.stateKey ?? outgoing.children}`}
            className={styles.outgoing}
            aria-hidden="true"
          >
            {outgoing.icon}
            {outgoing.children}
          </span>
        )}
        <span className={styles.measure} ref={measure} aria-hidden="true">
          {icon}
          {children}
        </span>
      </button>
    );
  },
);
