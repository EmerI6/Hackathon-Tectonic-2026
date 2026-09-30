import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { LifeMoment } from '../../types';

interface Props {
  moment: LifeMoment | null;
  visible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

const AUTO_HIDE_MS = 9000;

export function MomentNotification({ moment, visible, onOpen, onDismiss }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <div className={`notification${visible && moment ? ' is-visible' : ''}`} aria-live="polite">
      {moment && (
        <div className="notification-card" role="button" tabIndex={0} onClick={onOpen}>
          <span className="notification-app">KM</span>
          <div className="notification-body">
            <div className="notification-meta">
              <strong>KBC Moments</strong>
              <span>now</span>
            </div>
            <p>{moment.notification}</p>
          </div>
          <button
            className="notification-close"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
