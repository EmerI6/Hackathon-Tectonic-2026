import { CalendarClock, ChevronLeft, CircleCheck, Headset, Info, Sparkles, ThumbsDown, Zap } from 'lucide-react';
import type { LifeMoment, MomentResponse, Signal } from '../../types';
import { momentIcons } from '../iconMaps';

interface Props {
  moment: LifeMoment | null;
  /** Only the signals the detector actually found (may be a subset). */
  signals: Signal[];
  response: MomentResponse | null;
  onRespond: (response: MomentResponse) => void;
  onBack: () => void;
  onOpenPrivacy: () => void;
}

export function MomentDetail({ moment, signals, response, onRespond, onBack, onOpenPrivacy }: Props) {
  if (!moment || response === 'dismissed') {
    return (
      <div className="screen">
        <header className="screen-header">
          <h1>Moments</h1>
        </header>
        <div className="empty-state card">
          <span className="empty-icon">
            <Sparkles size={26} />
          </span>
          {response === 'dismissed' ? (
            <>
              <strong>Thanks for letting us know</strong>
              <p className="muted">We won’t show this suggestion again and will use your feedback to get better.</p>
            </>
          ) : (
            <>
              <strong>Nothing new right now</strong>
              <p className="muted">When something important happens in your life, we’ll suggest what could help.</p>
            </>
          )}
          <button className="link" onClick={onOpenPrivacy}>
            Choose which moments we may detect
          </button>
        </div>
      </div>
    );
  }

  const Icon = momentIcons[moment.type];
  const { recommendation } = moment;

  return (
    <div className="screen moment-detail">
      <button className="back" onClick={onBack}>
        <ChevronLeft size={18} /> Home
      </button>

      <div className="moment-hero">
        <span className="moment-hero-icon">
          <Icon size={28} />
        </span>
        <span className="pill">Life moment · {moment.title}</span>
        <h1>{moment.headline}</h1>
        <p>{moment.message}</p>
      </div>

      <section className="card why">
        <h2>
          <Info size={16} /> Why am I seeing this?
        </h2>
        <ul>
          {signals.map((s) => (
            <li key={s.id}>
              <CircleCheck size={16} />
              <span>{s.customerExplanation}</span>
            </li>
          ))}
        </ul>
        <p className="why-footer">
          Based on your own account activity. You decide what we may detect in{' '}
          <button className="link" onClick={onOpenPrivacy}>
            Privacy
          </button>
          .
        </p>
      </section>

      <section className={`card recommendation${response === 'accepted' ? ' is-done' : ''}`}>
        <span className="section-label">Our suggestion</span>
        <h2>{recommendation.title}</h2>
        <p className="muted">{recommendation.description}</p>
        {response === 'accepted' ? (
          <div className="success">
            <CircleCheck size={20} />
            <span>{recommendation.confirmation}</span>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => onRespond('accepted')}>
            <Zap size={17} /> {recommendation.ctaLabel}
          </button>
        )}
      </section>

      {response === 'advisor' ? (
        <div className="success card">
          <CalendarClock size={20} />
          <span>An advisor from your local KBC branch will call you tomorrow between 10:00 and 12:00.</span>
        </div>
      ) : (
        response !== 'accepted' && (
          <div className="secondary-actions">
            <button className="btn btn-secondary" onClick={() => onRespond('advisor')}>
              <Headset size={17} /> Talk to an advisor
            </button>
            <button className="btn btn-ghost" onClick={() => onRespond('dismissed')}>
              <ThumbsDown size={15} /> Not relevant for me
            </button>
          </div>
        )
      )}
    </div>
  );
}
