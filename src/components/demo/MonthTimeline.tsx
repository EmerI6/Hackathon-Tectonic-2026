import { Play, RotateCcw, Sparkles } from 'lucide-react';
import type { Customer, DetectionStatus } from '../../types';

interface Props {
  customer: Customer;
  monthIndex: number;
  simulating: boolean;
  status: DetectionStatus | null;
  onSimulate: () => void;
  onReset: () => void;
}

export function MonthTimeline({ customer, monthIndex, simulating, status, onSimulate, onReset }: Props) {
  const months = [
    ...customer.history.map((m) => ({ ...m, state: 'past' })),
    ...customer.upcoming.map((m, i) => ({
      ...m,
      state: i < monthIndex - 1 ? 'past' : i === monthIndex - 1 ? 'current' : 'future',
    })),
  ];
  const next = customer.upcoming[monthIndex];
  const done = !next;

  return (
    <div className="timeline">
      <ol className="timeline-months">
        {months.map((m) => {
          const isMoment = m.state === 'current' && status === 'detected';
          return (
            <li key={m.key} className={`timeline-month is-${m.state}`}>
              <span className="timeline-dot">{isMoment && <Sparkles size={12} />}</span>
              <span className="timeline-label">{m.label}</span>
            </li>
          );
        })}
      </ol>
      <div className="timeline-actions">
        <button className="btn btn-accent" onClick={onSimulate} disabled={simulating || done}>
          <Play size={16} />
          {simulating ? 'Analysing…' : done ? 'All months simulated' : `Simulate next month (${next.label})`}
        </button>
        <button className="btn btn-icon" onClick={onReset} title="Reset this customer" aria-label="Reset">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
