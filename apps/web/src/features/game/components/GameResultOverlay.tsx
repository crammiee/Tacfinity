import { useNavigate } from 'react-router-dom';
import type { GameEndPayload } from '@tacfinity/shared';
import { Button } from '@/shared/ui/button';

interface Props {
  result: GameEndPayload;
  mySymbol: 'X' | 'O';
  onPlayAgain: () => void;
}

export function GameResultOverlay({ result, mySymbol, onPlayAgain }: Props) {
  const navigate = useNavigate();
  const isDraw = result.winner === 'draw';
  const won = result.winner === mySymbol;
  const delta = result.ratingDelta[mySymbol]; // signed number

  const heading = isDraw ? "It's a Draw!" : won ? 'You Win!' : 'You Lose';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border rounded-xl shadow-xl p-8 flex flex-col items-center gap-5 min-w-[280px]">
        <h2 className="text-3xl font-bold">{heading}</h2>

        {/* ELO delta */}

        <span className={`text-lg font-semibold ${delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {delta >= 0 ? '+' : ''}
          {delta} ELO
        </span>

        <div className="flex flex-col gap-2 w-full">
          <Button size="lg" className="w-full" onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
