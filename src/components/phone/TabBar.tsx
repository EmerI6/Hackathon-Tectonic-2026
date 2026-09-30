import { House, ListOrdered, ShieldCheck, Sparkles } from 'lucide-react';
import type { PhoneScreen } from '../../hooks/useDemo';

const tabs: { id: PhoneScreen; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'transactions', label: 'Activity', Icon: ListOrdered },
  { id: 'moment', label: 'Moments', Icon: Sparkles },
  { id: 'consent', label: 'Privacy', Icon: ShieldCheck },
];

interface Props {
  active: PhoneScreen;
  onChange: (screen: PhoneScreen) => void;
  momentBadge: boolean;
}

export function TabBar({ active, onChange, momentBadge }: Props) {
  return (
    <nav className="tab-bar">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab${active === id ? ' is-active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <span className="tab-icon">
            <Icon size={21} strokeWidth={active === id ? 2.4 : 2} />
            {id === 'moment' && momentBadge && <span className="tab-badge" />}
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
