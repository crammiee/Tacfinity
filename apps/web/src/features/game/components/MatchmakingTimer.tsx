import { type ReactElement, useEffect, useState } from 'react';

interface Props {
  searching: boolean;
}

export function MatchmakingTimer({ searching }: Props): ReactElement {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!searching) return;
    const intervalId = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(intervalId);
      setSeconds(0);
    };
  }, [searching]);

  const mm = String(Math.floor(seconds / 60)).padStart(1, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <p className="text-sm text-muted-foreground">
      Searching…{' '}
      <span className="font-mono">
        {mm}:{ss}
      </span>
    </p>
  );
}
