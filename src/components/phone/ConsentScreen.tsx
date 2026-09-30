import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { ConsentCategory, ConsentCategoryId, ConsentSettings } from '../../types';
import { momentIcons } from '../iconMaps';

interface Props {
  categories: ConsentCategory[];
  consent: ConsentSettings;
  onChange: (id: ConsentCategoryId, enabled: boolean) => void;
}

export function ConsentScreen({ categories, consent, onChange }: Props) {
  const [pending, setPending] = useState<ConsentCategoryId | null>(null);
  const standard = categories.filter((c) => !c.sensitive);
  const sensitive = categories.filter((c) => c.sensitive);

  const toggle = (c: ConsentCategory) => {
    const next = !consent[c.id];
    if (next && c.sensitive) {
      setPending(c.id);
      return;
    }
    onChange(c.id, next);
  };

  const row = (c: ConsentCategory) => {
    const Icon = momentIcons[c.id];
    const on = consent[c.id];
    return (
      <li key={c.id} className="consent-row">
        <span className={`consent-icon${c.sensitive ? ' is-sensitive' : ''}`}>
          <Icon size={18} />
        </span>
        <div className="consent-text">
          <strong>{c.label}</strong>
          <span className="muted small">{c.description}</span>
          {c.sensitive && (
            <span className="badge-sensitive">
              <Lock size={11} /> Requires explicit consent
            </span>
          )}
          {pending === c.id && (
            <div className="consent-confirm">
              <p>
                This moment uses sensitive information. KBC will only analyse it with your explicit consent, and you can
                withdraw it anytime.
              </p>
              <div className="consent-confirm-actions">
                <button className="btn btn-ghost btn-small" onClick={() => setPending(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => {
                    onChange(c.id, true);
                    setPending(null);
                  }}
                >
                  I give my consent
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-label={c.label}
          className={`switch${on ? ' is-on' : ''}`}
          onClick={() => toggle(c)}
        >
          <span />
        </button>
      </li>
    );
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Privacy & consent</h1>
        <p className="muted">Choose which life moments KBC may detect from your account activity.</p>
      </header>

      <div className="privacy-note">
        <ShieldCheck size={18} />
        <span>Your data never leaves KBC and is never sold. Turning a moment off stops its detection immediately.</span>
      </div>

      <h2 className="section-label">Life moments</h2>
      <ul className="card consent-list">{standard.map(row)}</ul>

      <h2 className="section-label">Sensitive moments</h2>
      <p className="muted small consent-sensitive-intro">Off by default. We only turn these on when you say so.</p>
      <ul className="card consent-list">{sensitive.map(row)}</ul>
    </div>
  );
}
