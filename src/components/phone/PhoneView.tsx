import type { PhoneScreen } from '../../hooks/useDemo';
import type {
  ConsentCategory,
  ConsentCategoryId,
  ConsentSettings,
  Customer,
  LifeMoment,
  MomentResponse,
  Transaction,
} from '../../types';
import { ConsentScreen } from './ConsentScreen';
import { HomeScreen } from './HomeScreen';
import { MomentDetail } from './MomentDetail';
import { MomentNotification } from './MomentNotification';
import { PhoneFrame } from './PhoneFrame';
import { TabBar } from './TabBar';
import { TransactionList } from './TransactionList';

/** What the phone needs; provided by both the demo and the live hooks. */
export interface PhoneState {
  customer: Customer | null;
  consent: ConsentSettings | null;
  consentCategories: ConsentCategory[];
  balances: { current: number; savings: number };
  transactions: Transaction[];
  newTxIds: Set<string>;
  activeMoment: LifeMoment | null;
  response: MomentResponse | null;
  screen: PhoneScreen;
  setScreen: (s: PhoneScreen) => void;
  notificationVisible: boolean;
  dismissNotification: () => void;
  openMoment: () => void;
  respond: (r: MomentResponse) => void;
  toggleConsent: (category: ConsentCategoryId, enabled: boolean) => void;
}

export function PhoneView({ state, transitionKey }: { state: PhoneState; transitionKey: string }) {
  const { customer, consent, activeMoment, screen, setScreen } = state;

  let content = <div className="phone-loading" />;
  if (customer && consent) {
    switch (screen) {
      case 'home':
        content = (
          <HomeScreen
            customer={customer}
            balances={state.balances}
            transactions={state.transactions}
            newTxIds={state.newTxIds}
            moment={activeMoment}
            response={state.response}
            onOpenMoment={state.openMoment}
            onSeeAll={() => setScreen('transactions')}
          />
        );
        break;
      case 'transactions':
        content = <TransactionList transactions={state.transactions} newTxIds={state.newTxIds} />;
        break;
      case 'moment':
        content = (
          <MomentDetail
            moment={activeMoment}
            signals={activeMoment?.signals ?? []}
            response={state.response}
            onRespond={state.respond}
            onBack={() => setScreen('home')}
            onOpenPrivacy={() => setScreen('consent')}
          />
        );
        break;
      case 'consent':
        content = (
          <ConsentScreen categories={state.consentCategories} consent={consent} onChange={state.toggleConsent} />
        );
        break;
    }
  }

  return (
    <div className="phone-column">
      <PhoneFrame
        overlay={
          <MomentNotification
            moment={activeMoment}
            visible={state.notificationVisible}
            onOpen={state.openMoment}
            onDismiss={state.dismissNotification}
          />
        }
        tabBar={
          <TabBar
            active={screen}
            onChange={setScreen}
            momentBadge={!!activeMoment && !state.response && screen !== 'moment'}
          />
        }
      >
        <div className="screen-transition" key={`${transitionKey}-${screen}`}>
          {content}
        </div>
      </PhoneFrame>
      <p className="phone-caption">What the customer sees</p>
    </div>
  );
}
