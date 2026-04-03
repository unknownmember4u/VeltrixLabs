// src/components/ui/CountUp.jsx
import { useEffect, useRef, useState, useCallback } from 'react';

export const CountUp = ({ target, suffix = "", prefix = "", duration = 1800, decimals = 0 }) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const startCount = useCallback(() => {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out cubic for a premium slowdown effect
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, decimals]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          startCount();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [startCount]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}{suffix}
    </span>
  );
};
