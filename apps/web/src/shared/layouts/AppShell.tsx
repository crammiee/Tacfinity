import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
