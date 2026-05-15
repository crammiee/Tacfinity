import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

export function PlayMenu() {
  return (
    <section className="flex flex-col gap-4 py-10 items-center justify-center">
      <h2 className="text-2xl font-bold">Play</h2>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild size="lg">
          <Link to="/play/online">Play Ranked</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/play/bot">vs Bot</Link>
        </Button>
      </div>
    </section>
  );
}
