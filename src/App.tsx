import { useEffect, useState, type MouseEvent } from 'react';
import { DemoPanel } from './components/demo/DemoPanel';
import { LivePanel } from './components/live/LivePanel';
import { PhoneView } from './components/phone/PhoneView';
import { useDemo } from './hooks/useDemo';
import { useLive } from './hooks/useLive';

type Mode = 'demo' | 'live';

const modeFromPath = (): Mode => (window.location.pathname.startsWith('/live') ? 'live' : 'demo');

function DemoMode() {
  const demo = useDemo();
  return (
    <main className="stage">
      <PhoneView state={demo} transitionKey={demo.customerId} />
      <DemoPanel demo={demo} />
    </main>
  );
}

function LiveMode() {
  const live = useLive();
  return (
    <main className="stage">
      <PhoneView state={live} transitionKey="live" />
      <LivePanel live={live} />
    </main>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>(modeFromPath);

  useEffect(() => {
    const onPop = () => setMode(modeFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (m: Mode) => (e: MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, '', `/${m}`);
    setMode(m);
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">
          KBC <span>Moments</span>
        </span>
        <span className="app-tagline">Life moment detector · Hackathon proof of concept</span>
        <nav className="mode-toggle" aria-label="Mode">
          <a href="/demo" className={mode === 'demo' ? 'is-active' : ''} onClick={go('demo')}>
            Demo
          </a>
          <a href="/live" className={mode === 'live' ? 'is-active' : ''} onClick={go('live')}>
            Live
          </a>
        </nav>
        <span className="app-header-badge">
          {mode === 'demo' ? 'Demo · scripted customers · Gemini + fallback' : 'Live · your data · real Gemini call'}
        </span>
      </header>
      {mode === 'demo' ? <DemoMode /> : <LiveMode />}
    </div>
  );
}
