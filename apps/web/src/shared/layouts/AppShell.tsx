import { Outlet, Link } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="flex items-center gap-6 px-6 py-4 border-b">
        <Link to="/" className="font-bold text-lg">
          Logo
        </Link>
        <Link to="/play">Play</Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet /> {}
      </main>
    </div>
  );
}
