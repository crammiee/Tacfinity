import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell, AuthShell } from './shared/layouts';
import { RequireAuth } from './shared/components/RequireAuth';
import { NotFoundPage } from './shared/components/NotFoundPage';
import { HomePage } from './features/home';

const LoginPage = lazy(() => import('./features/auth').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('./features/auth').then((m) => ({ default: m.RegisterPage }))
);
const OnlineGamePage = lazy(() =>
  import('./features/game').then((m) => ({ default: m.OnlineGamePage }))
);
const BotGamePage = lazy(() => import('./features/game').then((m) => ({ default: m.BotGamePage })));
const ProfilePage = lazy(() =>
  import('./features/profile').then((m) => ({ default: m.ProfilePage }))
);

export function AppRoutes() {
  return (
    <Suspense>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play/bot" element={<BotGamePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />

          <Route element={<RequireAuth />}>
            <Route path="/play/online" element={<OnlineGamePage />} />
            <Route path="/play/online/:code" element={<OnlineGamePage />} />
          </Route>
        </Route>

        <Route element={<AuthShell />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
