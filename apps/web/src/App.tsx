import { useBootstrapAuth } from '@/features/auth/useBootstrapAuth';
import { AppRoutes } from './routes';

export function App() {
  useBootstrapAuth();
  return <AppRoutes />;
}
