import { Route, Routes } from 'react-router-dom';
import { AppShell, AuthShell } from './shared/layouts';
import { RequireAuth } from './shared/components/RequireAuth';
import { HomePage } from './features/home';
import { LoginPage, RegisterPage } from './features/auth';
import { OnlineGamePage, BotGamePage } from './features/game';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/bot" element={<BotGamePage />} />

        <Route element={<RequireAuth />}>
          <Route path="/play/online" element={<OnlineGamePage />} />
        </Route>
      </Route>

      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
