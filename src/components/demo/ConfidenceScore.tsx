import { useEffect, useState } from 'react';

interface Props {
  value: number;
  threshold: number;
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

export function ConfidenceScore({ value, threshold }: Props) {
  const shown = useCountUp(value);
  const above = value >= threshold;

  return (
    <div className="confidence">
      <div className="confidence-head">
        <span className="section-label">Confidence score</span>
        <span className={`confidence-value${above ? ' is-above' : ''}`}>{shown}%</span>
      </div>
      <div className="confidence-track">
        <div className={`confidence-fill${above ? ' is-above' : ''}`} style={{ width: `${shown}%` }} />
        <div className="confidence-threshold" style={{ left: `${threshold}%` }}>
          <span>Action threshold {threshold}%</span>
        </div>
      </div>
    </div>
  );
}
