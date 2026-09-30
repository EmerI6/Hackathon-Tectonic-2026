import { ChevronRight, PiggyBank, Wallet } from 'lucide-react';
import type { Customer, LifeMoment, MomentResponse, Transaction } from '../../types';
import { formatEuro } from '../../utils/format';
import { momentIcons } from '../iconMaps';
import { TransactionList } from './TransactionList';

interface Props {
  customer: Customer;
  balances: { current: number; savings: number };
  transactions: Transaction[];
  newTxIds: Set<string>;
  moment: LifeMoment | null;
  response: MomentResponse | null;
  onOpenMoment: () => void;
  onSeeAll: () => void;
}

const responseLabel: Record<Exclude<MomentResponse, 'dismissed'>, string> = {
  accepted: 'Activated',
  advisor: 'Advisor call requested',
};

export function HomeScreen({
  customer,
  balances,
  transactions,
  newTxIds,
  moment,
  response,
  onOpenMoment,
  onSeeAll,
}: Props) {
  const showMoment = moment && response !== 'dismissed';
  const MomentIcon = moment ? momentIcons[moment.type] : null;

  return (
    <div className="screen">
      <header className="home-header">
        <span className="logo logo-small">
          KBC <span>Moments</span>
        </span>
        <span className="avatar" style={{ background: customer.avatarColor }}>
          {customer.firstName.charAt(0)}
        </span>
      </header>
      <h1 className="greeting">Hi {customer.firstName}</h1>

      {showMoment && MomentIcon && (
        <button className={`moment-card${response ? ' is-done' : ''}`} onClick={onOpenMoment}>
          <span className="moment-card-icon">
            <MomentIcon size={22} />
          </span>
          <span className="moment-card-body">
            <span className="moment-card-tag">
              {response ? responseLabel[response] : 'Life moment for you'}
            </span>
            <strong>{moment.headline}</strong>
            <span className="moment-card-cta">
              {response ? moment.recommendation.product : moment.recommendation.title}
              <ChevronRight size={16} />
            </span>
          </span>
        </button>
      )}

      <div className="account-card">
        <div className="account-card-top">
          <Wallet size={18} />
          <span>Current account</span>
        </div>
        <div className="account-balance">{formatEuro(balances.current)}</div>
        <div className="account-iban">BE68 7340 1234 5678</div>
      </div>

      <div className="card savings-card">
        <span className="savings-icon">
          <PiggyBank size={20} />
        </span>
        <div>
          <span className="muted small">Savings account</span>
          <div className="savings-balance">{formatEuro(balances.savings)}</div>
        </div>
        <ChevronRight size={18} className="muted" />
      </div>

      <div className="section-row">
        <h2 className="section-label">Recent transactions</h2>
        <button className="link" onClick={onSeeAll}>
          See all
        </button>
      </div>
      <div className="card">
        <TransactionList transactions={transactions} newTxIds={newTxIds} limit={4} />
      </div>
    </div>
  );
}
