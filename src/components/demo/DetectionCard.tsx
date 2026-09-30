import { CircleCheck, CircleMinus, CircleX, Cloud, Database, Radar } from 'lucide-react';
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
  idle: 'No break',
  monitoring: 'Monitoring',
  detected: 'Moment detected',
  blocked: 'Blocked · no consent',
  suppressed: 'Suppressed · feedback',
};

const responseLabel: Record<MomentResponse, string> = {
  accepted: 'Accepted the one-tap action',
  advisor: 'Asked to talk to an advisor',
  dismissed: 'Marked as not relevant · stored and fed back to the next LLM call',
};

const guardrailIcon = { pass: CircleCheck, fail: CircleX, skip: CircleMinus };

function SourceBadge({ detection }: { detection: Detection }) {
  if (detection.source === 'live-gemini') {
    return (
      <span className="source-badge is-live">
        <Cloud size={13} /> Live Gemini · {detection.model}
      </span>
    );
  }
  if (detection.source === 'no-break') return <span className="source-badge">LLM not called</span>;
  return (
    <span className="source-badge is-fallback" title={detection.fallbackReason}>
      <Database size={13} /> Pre-recorded Gemini answer · {detection.fallbackReason}
    </span>
  );
}

export function DetectionCard({ detection, step, response }: Props) {
  if (!detection || step < 1) {
    return (
      <div className="panel-card detection is-empty">
        <Radar size={22} />
        <div>
          <strong>Listening for breaks…</strong>
          <p className="muted small">Simulate the next month: the last 2 months are compared with the 6 before.</p>
        </div>
      </div>
    );
  }

  const { chosen, status, summary } = detection;
  const Icon = chosen ? momentIcons[chosen.category] : Radar;

  return (
    <div className={`panel-card detection is-${status}`} key={`${detection.demoKey}-${status}`}>
      <div className="detection-head">
        <span className="detection-icon">
          <Icon size={22} />
        </span>
        <div>
          <span className="section-label">LLM interpretation · free text</span>
          <h3>{chosen?.moment ?? 'No significant break'}</h3>
        </div>
        <span className={`status-chip is-${status}`}>{statusLabel[status]}</span>
      </div>

      <SourceBadge detection={detection} />

      {chosen && (
        <>
          <ConfidenceScore value={detection.confidence} threshold={detection.threshold} />

          <div className="signals">
            <span className="section-label">Justifying signals</span>
            <ul>
              {chosen.signals.map((s, i) => (
                <li key={s.label} className="llm-signal" style={{ animationDelay: `${i * 120}ms` }}>
                  <strong>{s.label}</strong>
                  <span className="muted small">{s.source}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="llm-need small">
            <strong>Need:</strong> {chosen.customerNeed} · <strong>Product:</strong> {chosen.productCategory}
            {chosen.sensitive && <span className="sensitive-tag">sensitive</span>}
          </p>
        </>
      )}

      <div className="guardrails">
        <span className="section-label">Rule guardrails (after the LLM)</span>
        <ul>
          {detection.guardrails.map((g) => {
            const G = guardrailIcon[g.result];
            return (
              <li key={g.rule} className={`is-${g.result}`}>
                <G size={15} />
                <strong>{g.rule}</strong>
                <span className="muted small">{g.detail}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <details className="break-summary">
        <summary>Anonymised break summary sent to the LLM</summary>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
      </details>

      {response && (
        <div className={`response-row is-${response}`}>
          <span className="section-label">Customer feedback</span>
          <span>{responseLabel[response]}</span>
        </div>
      )}
    </div>
  );
}
