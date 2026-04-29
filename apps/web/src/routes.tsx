import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, AuthShell } from './shared/layouts';
import { OfflineGamePage } from './features/offline-bot';
import { LoginPage, RegisterPage } from './features/auth';

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
