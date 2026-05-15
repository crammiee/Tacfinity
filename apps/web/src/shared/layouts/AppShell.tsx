import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { BottomNav } from '@/shared/components/BottomNav';
import { OfflineBanner } from '@/pwa/OfflineBanner';

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-transparent">
      <OfflineBanner />
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
