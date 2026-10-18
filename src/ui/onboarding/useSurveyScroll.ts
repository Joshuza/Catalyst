import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

/** Read native scrolling; never intercept wheel, touch, or keyboard events. */
export function useSurveyScroll(
  root: RefObject<HTMLDivElement>,
  enabled: boolean,
) {
  const [active, setActive] = useState(-1);
  const [progress, setProgress] = useState(0);
  const pending = useRef<number | null>(null);
  const reveal = useCallback(
    (index: number) => {
      const stop = root.current?.querySelector<HTMLElement>(
        `[data-survey-stop="${index}"]`,
      );
      stop?.scrollIntoView({ block: 'start', behavior: 'instant' });
      stop?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    },
    [root],
  );
  useLayoutEffect(() => {
    if (pending.current === null) return;
    const destination = pending.current;
    pending.current = null;
    reveal(destination);
  }, [active, reveal]);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const stops = Array.from(
        root.current?.querySelectorAll<HTMLElement>('[data-survey-stop]') ?? [],
      );
      // Keep a long form active until the next question reaches the header.
      const firstQuestion = stops[1] ?? stops[0];
      if (!firstQuestion) return;
      const probe =
        (parseFloat(getComputedStyle(firstQuestion).scrollMarginTop) || 0) + 1;
      const visible =
        [...stops]
          .reverse()
          .find((stop) => stop.getBoundingClientRect().top <= probe) ??
        stops[0];
      if (visible) setActive(Number(visible.dataset.surveyStop));
      const first = stops[0],
        last = stops.at(-1);
      if (!first || !last) return;
      const start = first.getBoundingClientRect().top;
      const end = last.getBoundingClientRect().top;
      setProgress(Math.max(0, Math.min(1, -start / Math.max(1, end - start))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    read();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [root, enabled]);
  const goTo = useCallback(
    (index: number) => {
      if (index === active) {
        reveal(index);
        return;
      }
      pending.current = index;
      setActive(index);
    },
    [active, reveal],
  );
  return { active, progress, goTo };
}
