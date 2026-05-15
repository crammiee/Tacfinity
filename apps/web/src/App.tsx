import { useBootstrapAuth } from '@/features/auth/useBootstrapAuth';
import { WakeupScreen } from '@/shared/components/WakeupScreen';
import { AppRoutes } from './routes';

export function App() {
  useBootstrapAuth();
  return (
    <>
      <WakeupScreen />
      <AppRoutes />
    </>
  );
}
