import type { DemoState } from '../../hooks/useDemo';
import { CustomerSelector } from './CustomerSelector';
import { DetectionCard } from './DetectionCard';
import { MonthTimeline } from './MonthTimeline';
import { Pipeline } from './Pipeline';

export function DemoPanel({ demo }: { demo: DemoState }) {
  const { customer } = demo;

  return (
    <aside className="demo-panel">
      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">1</span> Choose a customer
        </h2>
        <CustomerSelector customers={demo.customers} selected={demo.customerId} onSelect={demo.setCustomerId} />
      </section>

      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">2</span> Customer timeline
          {customer && <span className="panel-subtitle">{customer.displayName} · {customer.city}</span>}
        </h2>
        {customer && (
          <MonthTimeline
            customer={customer}
            monthIndex={demo.monthIndex}
            simulating={demo.simulating}
            status={demo.detection?.status ?? null}
            onSimulate={demo.simulate}
            onReset={demo.reset}
          />
        )}
      </section>

      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">3</span> Detection pipeline
        </h2>
        <Pipeline
          step={demo.pipelineStep}
          outcome={demo.pipelineOutcome}
          detection={demo.detection}
          newTransactions={demo.newTxIds.size}
        />
        <DetectionCard detection={demo.detection} step={demo.pipelineStep} response={demo.response} />
      </section>
    </aside>
  );
}
