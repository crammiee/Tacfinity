import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function AuthShell() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative">
      {/* Brand above card */}
      <Link
        to="/"
        className="relative z-10 font-extrabold text-2xl tracking-tight text-primary hover:opacity-80 transition-opacity"
      >
        Tacfinity
      </Link>

      {/* Glass card */}
      <div className="glass rounded-xl w-full max-w-md p-8 relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
