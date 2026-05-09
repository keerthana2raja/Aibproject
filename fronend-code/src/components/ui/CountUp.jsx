import React, { useState, useEffect, useRef } from 'react';

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Integer count-up / animated counter: starts at 0, eases to `end`. Respects prefers-reduced-motion.
 */
export default function CountUp({ end = 0, duration = 900, delay = 0, className }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = Math.round(Number(end)) || 0;
    if (reduced) {
      setDisplay(target);
      return;
    }

    let startTs = null;
    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      if (elapsed < delay) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const u = Math.min((elapsed - delay) / duration, 1);
      setDisplay(Math.round(easeOutCubic(u) * target));
      if (u < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(target);
    };

    setDisplay(0);
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, delay]);

  return <span className={className}>{display}</span>;
}
