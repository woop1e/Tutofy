import React from 'react';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopBarActions() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LanguageSwitcher variant="topbar" />
      <NotificationBell />
    </div>
  );
}
