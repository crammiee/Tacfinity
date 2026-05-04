import { Button } from '@/shared/ui/button';
import { useAuth } from '@/features/auth/useAuth';

export function OnlineGamePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 h-full">
      {/* Center — board area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <PlayerLabel username="Searching..." rating={null} />

        <BoardPlaceholder />

        <PlayerLabel username={user?.username ?? 'You'} rating={1000} isMe />
      </div>

      {/* Right panel */}
      <aside className="w-64 shrink-0 border-l flex flex-col items-center justify-center gap-4 p-6">
        <Button size="lg" className="w-full">
          Start Game
        </Button>
      </aside>
    </div>
  );
}

function PlayerLabel({
  username,
  rating,
  isMe = false,
}: {
  username: string;
  rating: number | null;
  isMe?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm w-full max-w-[440px]">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
        {username[0]}
      </div>
      <span className={`font-medium ${isMe ? '' : 'text-muted-foreground'}`}>{username}</span>
      {rating !== null && (
        <span className="ml-auto text-muted-foreground">♟ {rating.toLocaleString()}</span>
      )}
    </div>
  );
}

function BoardPlaceholder() {
  return (
    <div className="border-2 border-border rounded-lg w-[440px] h-[440px] flex items-center justify-center text-muted-foreground text-sm">
      11 × 11 board
    </div>
  );
}
