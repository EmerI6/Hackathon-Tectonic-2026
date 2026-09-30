import { Radar } from 'lucide-react';
import type { PipelineStep } from '../../hooks/useDemo';
import type { Detection, MomentResponse } from '../../types';
import { momentIcons } from '../iconMaps';
import { ConfidenceScore } from './ConfidenceScore';

interface Props {
  detection: Detection | null;
  step: PipelineStep;
  response: MomentResponse | null;
}

const statusLabel: Record<Detection['status'], string> = {
  idle: 'No signals',
  monitoring: 'Monitoring',
  detected: 'Moment detected',
  blocked: 'Blocked · no consent',
};

const responseLabel: Record<MomentResponse, string> = {
  accepted: 'Accepted the one-tap action',
  advisor: 'Asked to talk to an advisor',
  dismissed: 'Marked as not relevant · fed back to the model',
};

export function DetectionCard({ detection, step, response }: Props) {
  if (!detection || step < 1) {
    return (
      <div className="panel-card detection is-empty">
        <Radar size={22} />
        <div>
          <strong>Listening for signals…</strong>
          <p className="muted small">Simulate the next month to feed new transactions into the detector.</p>
        </div>
      </div>
    );
  }

  const { moment, signals, confidence, status } = detection;
  const Icon = momentIcons[moment.type];
  const maxWeight = Math.max(...moment.signals.map((s) => s.weight));

  return (
    <div className={`panel-card detection is-${status}`} key={`${moment.id}-${confidence}`}>
      <div className="detection-head">
        <span className="detection-icon">
          <Icon size={22} />
        </span>
        <div>
          <span className="section-label">Detected life moment</span>
          <h3>{moment.title}</h3>
        </div>
        <span className={`status-chip is-${status}`}>{statusLabel[status]}</span>
      </div>

      <ConfidenceScore value={confidence} threshold={moment.threshold} />

      <div className="signals">
        <span className="section-label">Weighted signals</span>
        <ul>
          {signals.map((s, i) => (
            <li key={s.id} style={{ animationDelay: `${i * 120}ms` }}>
              <div className="signal-text">
                <strong>{s.label}</strong>
                <span className="muted small">{s.source}</span>
              </div>
              <div className="signal-bar">
                <span style={{ width: `${(s.weight / maxWeight) * 100}%` }} />
              </div>
              <span className="signal-weight">+{s.weight}</span>
            </li>
          ))}
        </ul>
      </div>

      {response && (
        <div className={`response-row is-${response}`}>
          <span className="section-label">Customer feedback</span>
          <span>{responseLabel[response]}</span>
        </div>
      )}
    </div>
  );
}
