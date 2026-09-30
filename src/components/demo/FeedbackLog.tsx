import { ThumbsDown, Trash2 } from 'lucide-react';
import type { FeedbackEntry, MomentResponse } from '../../types';

const label: Record<MomentResponse, string> = {
  accepted: 'accepted',
  advisor: 'asked for an advisor',
  dismissed: 'not relevant',
};

export function FeedbackLog({ entries, onClear }: { entries: FeedbackEntry[]; onClear: () => void }) {
  return (
    <div className="feedback-log">
      {entries.length === 0 ? (
        <p className="muted small">
          No feedback yet. “Not relevant for me” is stored server-side and suppresses that moment next time.
        </p>
      ) : (
        <ul>
          {entries.slice(0, 4).map((f) => (
            <li key={f.at} className={`is-${f.response}`}>
              {f.response === 'dismissed' && <ThumbsDown size={13} />}
              <strong>{f.customerId}</strong>
              <span>
                “{f.moment}” · {label[f.response]}
              </span>
              <span className="muted small">{new Date(f.at).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      )}
      {entries.length > 0 && (
        <button className="btn btn-icon" onClick={onClear} title="Clear feedback" aria-label="Clear feedback">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
