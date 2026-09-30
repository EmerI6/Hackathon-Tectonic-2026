import { DemoPanel } from './components/demo/DemoPanel';
import { ConsentScreen } from './components/phone/ConsentScreen';
import { HomeScreen } from './components/phone/HomeScreen';
import { MomentDetail } from './components/phone/MomentDetail';
import { MomentNotification } from './components/phone/MomentNotification';
import { PhoneFrame } from './components/phone/PhoneFrame';
import { TabBar } from './components/phone/TabBar';
import { TransactionList } from './components/phone/TransactionList';
import { useDemo } from './hooks/useDemo';

export default function App() {
  const demo = useDemo();
  const { customer, consent, activeMoment, screen, setScreen } = demo;

  let content = <div className="phone-loading" />;
  if (customer && consent) {
    switch (screen) {
      case 'home':
        content = (
          <HomeScreen
            customer={customer}
            balances={demo.balances}
            transactions={demo.transactions}
            newTxIds={demo.newTxIds}
            moment={activeMoment}
            response={demo.response}
            onOpenMoment={demo.openMoment}
            onSeeAll={() => setScreen('transactions')}
          />
        );
        break;
      case 'transactions':
        content = <TransactionList transactions={demo.transactions} newTxIds={demo.newTxIds} />;
        break;
      case 'moment':
        content = (
          <MomentDetail
            moment={activeMoment}
            signals={demo.detection?.signals ?? []}
            response={demo.response}
            onRespond={demo.respond}
            onBack={() => setScreen('home')}
            onOpenPrivacy={() => setScreen('consent')}
          />
        );
        break;
      case 'consent':
        content = (
          <ConsentScreen categories={demo.consentCategories} consent={consent} onChange={demo.toggleConsent} />
        );
        break;
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">
          KBC <span>Moments</span>
        </span>
        <span className="app-tagline">Life moment detector · Hackathon proof of concept</span>
        <span className="app-header-badge">Demo mode · mock data</span>
      </header>

      <main className="stage">
        <div className="phone-column">
          <PhoneFrame
            overlay={
              <MomentNotification
                moment={activeMoment}
                visible={demo.notificationVisible}
                onOpen={demo.openMoment}
                onDismiss={demo.dismissNotification}
              />
            }
            tabBar={
              <TabBar
                active={screen}
                onChange={setScreen}
                momentBadge={!!activeMoment && !demo.response && screen !== 'moment'}
              />
            }
          >
            <div className="screen-transition" key={`${demo.customerId}-${screen}`}>
              {content}
            </div>
          </PhoneFrame>
          <p className="phone-caption">What the customer sees</p>
        </div>
        <DemoPanel demo={demo} />
      </main>
    </div>
  );
}
