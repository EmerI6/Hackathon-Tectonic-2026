import { BatteryFull, SignalHigh, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  overlay?: ReactNode;
  tabBar?: ReactNode;
}

export function PhoneFrame({ children, overlay, tabBar }: Props) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-notch" />
          <span className="phone-status-icons">
            <SignalHigh size={14} />
            <Wifi size={14} />
            <BatteryFull size={16} />
          </span>
        </div>
        {overlay}
        <div className="phone-content">{children}</div>
        {tabBar}
        <div className="phone-home-indicator" />
      </div>
    </div>
  );
}
