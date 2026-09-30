import { Brain, Radar, Scale, Send, type LucideIcon } from 'lucide-react';
import type { PipelineOutcome, PipelineStep } from '../../hooks/useDemo';
import type { Detection } from '../../types';

interface Props {
  step: PipelineStep;
  outcome: PipelineOutcome;
  detection: Detection | null;
  newTransactions: number;
}

interface StepDef {
  title: string;
  Icon: LucideIcon;
  idle: string;
}

const steps: StepDef[] = [
  { title: 'Signals', Icon: Radar, idle: 'Transactions, income, savings, app usage' },
  { title: 'Understanding', Icon: Brain, idle: 'Gemini interprets the break' },
  { title: 'Decision', Icon: Scale, idle: 'Rule guardrails · one best action' },
  { title: 'Channel', Icon: Send, idle: 'Reach the customer at the right moment' },
];

function describe(i: number, props: Props): string {
  const { step, outcome, detection, newTransactions } = props;
  if (step < i || (!detection && i > 0)) return steps[i].idle;
  switch (i) {
    case 0:
      return detection?.summary.hasBreak === false
        ? `${newTransactions} transactions · no break vs baseline`
        : `${newTransactions} transactions · break vs 6-month baseline`;
    case 1:
      if (!detection?.chosen) return 'No break · LLM not called';
      return `${detection.chosen.moment} · ${detection.confidence}%`;
    case 2:
      if (outcome === 'monitoring') return 'Below threshold · keep monitoring';
      if (outcome === 'blocked') return 'No customer consent · stopped';
      if (outcome === 'suppressed') return 'Marked not relevant before · stopped';
      if (outcome === 'idle') return 'Nothing to decide';
      return detection?.moment?.recommendation.product ?? steps[2].idle;
    case 3:
      return detection?.moment?.channel ?? steps[3].idle;
  }
  return '';
}

export function Pipeline(props: Props) {
  const { step, outcome } = props;
  const stoppedAt = outcome === 'monitoring' || outcome === 'blocked' || outcome === 'suppressed' || outcome === 'idle' ? 2 : null;

  return (
    <ol className="pipeline">
      {steps.map(({ title, Icon }, i) => {
        let state = 'pending';
        if (i < step) state = 'done';
        if (i === step) state = outcome === 'running' ? 'active' : 'done';
        if (stoppedAt !== null && i === stoppedAt) state = outcome === 'blocked' || outcome === 'suppressed' ? 'blocked' : 'stopped';
        if (stoppedAt !== null && i > stoppedAt) state = 'skipped';
        return (
          <li key={title} className={`pipeline-step is-${state}`}>
            <span className="pipeline-icon">
              <Icon size={20} />
            </span>
            <strong>{title}</strong>
            <span className="pipeline-desc">{describe(i, props)}</span>
          </li>
        );
      })}
    </ol>
  );
}
