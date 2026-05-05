interface Props {
  username: string;
  rating: number;
  symbol?: 'X' | 'O';
  isMe?: boolean;
  isActive?: boolean;
}

export function PlayerLabel({ username, rating, symbol, isMe = false, isActive = false }: Props) {
  return (
    <div
      className={[
        'flex items-center gap-2 text-sm w-full px-1',
        isActive ? 'ring-2 ring-primary rounded-md py-1' : '',
      ].join(' ')}
    >
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase shrink-0">
        {username[0]}
      </div>
      <span className={`font-medium truncate ${isMe ? '' : 'text-muted-foreground'}`}>
        {username}
      </span>
      {symbol && (
        <span className={`text-xs font-bold ${symbol === 'X' ? 'text-blue-500' : 'text-red-500'}`}>
          {symbol}
        </span>
      )}
      <span className="ml-auto text-muted-foreground shrink-0">♟ {rating.toLocaleString()}</span>
    </div>
  );
}
