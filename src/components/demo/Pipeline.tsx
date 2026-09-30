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
  { title: 'Understanding', Icon: Brain, idle: 'Score possible life moments' },
  { title: 'Decision', Icon: Scale, idle: 'Pick the one best next action' },
  { title: 'Channel', Icon: Send, idle: 'Reach the customer at the right moment' },
];

function describe(i: number, props: Props): string {
  const { step, outcome, detection, newTransactions } = props;
  if (step < i || (!detection && i > 0)) return steps[i].idle;
  switch (i) {
    case 0:
      return `${newTransactions} new transactions ingested`;
    case 1:
      return detection ? `${detection.moment.title} · ${detection.confidence}% confidence` : steps[1].idle;
    case 2:
      if (outcome === 'monitoring') return 'Below threshold · keep monitoring';
      if (outcome === 'blocked') return 'No customer consent · stopped';
      return detection ? detection.moment.recommendation.product : steps[2].idle;
    case 3:
      return detection?.moment.channel ?? steps[3].idle;
  }
  return '';
}

export function Pipeline(props: Props) {
  const { step, outcome } = props;
  const stoppedAt = outcome === 'monitoring' || outcome === 'blocked' ? 2 : null;

  return (
    <ol className="pipeline">
      {steps.map(({ title, Icon }, i) => {
        let state = 'pending';
        if (i < step) state = 'done';
        if (i === step) state = outcome === 'running' ? 'active' : 'done';
        if (stoppedAt !== null && i === stoppedAt) state = outcome === 'blocked' ? 'blocked' : 'stopped';
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
