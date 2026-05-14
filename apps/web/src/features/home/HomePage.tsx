import { useAuth } from '@/features/auth/useAuth';
import { HeroSection } from './components/HeroSection';
import { PlayMenu } from './components/PlayMenu';
import { Leaderboard } from './components/Leaderboard';
import { BoardDisplay } from './components/BoardDisplay';
import { TopBar } from './components/TopBar';

export function HomePage() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return (
      <>
        <TopBar />
        <main className="flex flex-col gap-10 p-8">
          <PlayMenu />
          <div className="flex flex-col items-center lg:flex-row lg:justify-center lg:items-center gap-20">
            <Leaderboard />
            <BoardDisplay />
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="flex flex-col gap-10 p-8">
      <HeroSection />
      <div className="flex flex-col items-center lg:flex-row lg:justify-center lg:items-center gap-20">
        <Leaderboard />
        <BoardDisplay />
      </div>
    </main>
  );
}
