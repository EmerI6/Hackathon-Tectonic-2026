import type { CustomerSummary } from '../../api/customers';
import type { CustomerId } from '../../types';

interface Props {
  customers: CustomerSummary[];
  selected: CustomerId;
  onSelect: (id: CustomerId) => void;
}

export function CustomerSelector({ customers, selected, onSelect }: Props) {
  return (
    <div className="customer-selector">
      {customers.map((c) => (
        <button
          key={c.id}
          className={`customer-option${c.id === selected ? ' is-selected' : ''}`}
          onClick={() => onSelect(c.id)}
        >
          <span className="avatar" style={{ background: c.avatarColor }}>
            {c.firstName.charAt(0)}
          </span>
          <span className="customer-option-text">
            <strong>
              {c.firstName}, {c.age}
            </strong>
            <span className="muted small">{c.persona}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
