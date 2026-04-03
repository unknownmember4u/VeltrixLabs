// src/components/ui/FadeUp.jsx
import { useEffect, useRef, useState } from 'react';

export const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) { 
          setVisible(true); 
          observer.disconnect(); 
        } 
      },
      { threshold: 0.12 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};
