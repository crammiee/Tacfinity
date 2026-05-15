import { PlayerLabel } from '@/shared/components/PlayerLabel';

interface PlayerSlot {
  username: string;
  rating?: number;
  symbol?: 'X' | 'O';
  isActive?: boolean;
}

interface Props {
  opponent: PlayerSlot;
  me: PlayerSlot;
  children: React.ReactNode;
}

export function MatchLayout({ opponent, me, children }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <PlayerLabel {...opponent} />
      {children}
      <PlayerLabel {...me} isMe />
    </div>
  );
}
