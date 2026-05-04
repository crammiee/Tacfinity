import { useAuth } from '@/features/auth/useAuth';
import { HeroSection } from './components/HeroSection';
import { PlayMenu } from './components/PlayMenu';
import { Leaderboard } from './components/Leaderboard';
import { TopBar } from './components/TopBar';

export function HomePage() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return (
      <>
        <TopBar />
        <main className="flex flex-col gap-10 p-8">
          <PlayMenu />
          <Leaderboard />
        </main>
      </>
    );
  }

  return (
    <main className="flex flex-col gap-10 p-8">
      <HeroSection />
      <Leaderboard />
    </main>
  );
}
