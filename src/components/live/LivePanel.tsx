import { AlertTriangle, Download, Play, Plus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { groupByMonth, LIVE_CATEGORIES, liveTx } from '../../api/live';
import type { LiveState } from '../../hooks/useLive';
import type { TransactionCategory } from '../../types';
import { formatEuro } from '../../utils/format';
import { DetectionCard } from '../demo/DetectionCard';
import { FeedbackLog } from '../demo/FeedbackLog';

function ManualEntry({ onAdd }: { onAdd: LiveState['addTransactions'] }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<TransactionCategory>('groceries');

  const value = Math.abs(Number(amount.replace(',', '.')));
  const valid = !!date && Number.isFinite(value) && value > 0;

  return (
    <form
      className="live-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onAdd([liveTx(date, description.trim() || category, type === 'income' ? value : -value, category)]);
        setDescription('');
        setAmount('');
      }}
    >
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      <input placeholder="Description / merchant" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Amount €" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select value={type} onChange={(e) => setType(e.target.value as 'expense' | 'income')} aria-label="Type">
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value as TransactionCategory)} aria-label="Category">
        {LIVE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button className="btn btn-secondary" type="submit" disabled={!valid}>
        <Plus size={15} /> Add
      </button>
    </form>
  );
}

export function LivePanel({ live }: { live: LiveState }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { profile, setProfile, transactions } = live;
  const months = groupByMonth(transactions);

  return (
    <aside className="demo-panel">
      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">1</span> Customer
          <span className="panel-subtitle">Kept in this browser only (localStorage)</span>
        </h2>
        <div className="live-profile">
          <label>
            First name
            <input value={profile.firstName} onChange={(e) => setProfile({ firstName: e.target.value })} />
          </label>
          <label>
            Age
            <input type="number" value={profile.age} onChange={(e) => setProfile({ age: Number(e.target.value) })} />
          </label>
          <label>
            Current account €
            <input type="number" value={profile.current} onChange={(e) => setProfile({ current: Number(e.target.value) })} />
          </label>
          <label>
            Savings €
            <input type="number" value={profile.savings} onChange={(e) => setProfile({ savings: Number(e.target.value) })} />
          </label>
        </div>
      </section>

      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">2</span> Transaction history
          <span className="panel-subtitle">
            {transactions.length} transactions · {months.length} months
          </span>
        </h2>
        <div className="live-import">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) live.importFromFile(f);
              e.target.value = '';
            }}
          />
          <button className="btn btn-accent" onClick={() => fileInput.current?.click()}>
            <Upload size={15} /> Import CSV / Excel
          </button>
          <span className="muted small">
            Columns: date, description, amount, category, type (optional).{' '}
            <a href="/templates/kbc-moments-template.csv" download>
              <Download size={12} /> Template
            </a>{' '}
            · Julie sample:{' '}
            <a href="/templates/julie-sample.xlsx" download>
              .xlsx
            </a>{' '}
            <a href="/templates/julie-sample.csv" download>
              .csv
            </a>
          </span>
        </div>
        {live.importMessage && <p className="small live-import-msg">{live.importMessage}</p>}
        <ManualEntry onAdd={live.addTransactions} />
        {transactions.length > 0 && (
          <div className="live-table-wrap">
            <table className="live-table">
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className={t.signal ? 'is-signal' : ''}>
                    <td>{t.date}</td>
                    <td>{t.merchant}</td>
                    <td className="muted">{t.category}</td>
                    <td className={t.amount >= 0 ? 'is-in' : ''}>{formatEuro(t.amount, { signed: true })}</td>
                    <td>
                      <button className="icon-link" aria-label="Remove" onClick={() => live.removeTransaction(t.id)}>
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {transactions.length > 0 && (
          <button className="link small" onClick={live.clearTransactions}>
            <Trash2 size={12} /> Clear all transactions
          </button>
        )}
      </section>

      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">3</span> Analyze
          <span className="panel-subtitle">Break detection → Gemini → guardrails</span>
        </h2>
        <div className="timeline-actions">
          <button className="btn btn-accent" onClick={live.analyze} disabled={live.analyzing || !transactions.length}>
            <Play size={16} /> {live.analyzing ? 'Asking Gemini…' : 'Analyze'}
          </button>
          <label className="live-fallback small">
            <input
              type="checkbox"
              checked={live.allowFallback}
              onChange={(e) => live.setAllowFallback(e.target.checked)}
            />
            If Gemini is unavailable, use a clearly labelled pre-recorded answer (closest demo profile)
          </label>
        </div>
        {live.error && (
          <div className="live-error" role="alert">
            <AlertTriangle size={16} />
            <span>{live.error}</span>
          </div>
        )}
        {live.detection && <DetectionCard detection={live.detection} step={3} response={live.response} />}
      </section>

      <section className="panel-section">
        <h2 className="panel-title">
          <span className="step-num">4</span> Learning loop
        </h2>
        <FeedbackLog entries={live.feedback} onClear={live.resetFeedback} />
      </section>
    </aside>
  );
}
