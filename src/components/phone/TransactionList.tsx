import { Sparkles } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatDate, formatEuro, monthLabel } from '../../utils/format';
import { CategoryIcon } from '../CategoryIcon';

interface Props {
  transactions: Transaction[];
  newTxIds: Set<string>;
  /** Compact mode is used on the home screen (no month headers). */
  limit?: number;
}

export function TransactionRow({ tx, isNew }: { tx: Transaction; isNew: boolean }) {
  return (
    <li className={`tx${tx.signal ? ' is-signal' : ''}${isNew ? ' is-new' : ''}`}>
      <CategoryIcon category={tx.category} highlight={!!tx.signal} />
      <div className="tx-main">
        <span className="tx-merchant">{tx.merchant}</span>
        <span className="tx-sub">
          {formatDate(tx.date)}
          {tx.description ? ` · ${tx.description}` : ''}
        </span>
        {tx.signal && (
          <span className="tx-signal">
            <Sparkles size={11} /> {tx.signal.label}
          </span>
        )}
      </div>
      <span className={`tx-amount${tx.amount > 0 ? ' is-positive' : ''}`}>
        {tx.amount === 0 ? 'Info' : formatEuro(tx.amount, { signed: true })}
      </span>
    </li>
  );
}

export function TransactionList({ transactions, newTxIds, limit }: Props) {
  if (limit) {
    return (
      <ul className="tx-list">
        {transactions.slice(0, limit).map((tx) => (
          <TransactionRow key={tx.id} tx={tx} isNew={newTxIds.has(tx.id)} />
        ))}
      </ul>
    );
  }

  const groups = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = tx.date.slice(0, 7);
    (acc[key] ??= []).push(tx);
    return acc;
  }, {});

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Activity</h1>
        <p className="muted">Current account · BE68 7340 1234 5678</p>
      </header>
      {Object.entries(groups).map(([month, txs]) => (
        <section key={month} className="tx-group">
          <h2 className="section-label">{monthLabel(month)}</h2>
          <ul className="tx-list card">
            {txs.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} isNew={newTxIds.has(tx.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
