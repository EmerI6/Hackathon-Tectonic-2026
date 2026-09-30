import type { TransactionCategory } from '../types';
import { categoryIcons } from './iconMaps';

export function CategoryIcon({ category, highlight }: { category: TransactionCategory; highlight?: boolean }) {
  const Icon = categoryIcons[category];
  return (
    <span className={`category-icon category-${category}${highlight ? ' is-signal' : ''}`}>
      <Icon size={18} strokeWidth={2} />
    </span>
  );
}
