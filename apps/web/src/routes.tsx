import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

// TODO(integration): replace stubs with real imports
// import { AppShell, AuthShell } from './shared/layouts';
// import { OfflineGamePage } from './features/offline-bot';
// import { LoginPage, RegisterPage } from './features/auth';
const AppShell = () => <Outlet />;
const AuthShell = () => <Outlet />;
const OfflineGamePage = () => <div>Offline game coming soon</div>;
const LoginPage = () => <div>Login coming soon</div>;
const RegisterPage = () => <div>Register coming soon</div>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/play" replace />} />

      <Route element={<AppShell />}>
        <Route path="/play" element={<OfflineGamePage />} />
      </Route>

      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
