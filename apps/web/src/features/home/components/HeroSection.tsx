import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center gap-6 py-24">
      <h1 className="text-5xl font-bold tracking-tight">Play Tic Tac Toe Online on the #1 Site!</h1>
      <p className="text-muted-foreground text-lg max-w-md">
        Join other players in this growing community
      </p>
      <Button asChild size="lg">
        <Link to="/register">Get Started</Link>
      </Button>
    </section>
  );
}
