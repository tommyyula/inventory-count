import { Outlet } from 'react-router-dom';
import { useOnlineStatus } from '@shared/hooks/useOnlineStatus';

export function MobileLayout() {
  const isOnline = useOnlineStatus();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Network indicator */}
      <div style={{
        background: isOnline ? '#52c41a' : '#ff4d4f',
        color: '#fff',
        textAlign: 'center',
        padding: '2px 0',
        fontSize: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {isOnline ? '🟢 在线' : '🔴 离线'}
      </div>
      <div style={{ flex: 1, padding: '0 0 env(safe-area-inset-bottom)' }}>
        <Outlet />
      </div>
    </div>
  );
}
