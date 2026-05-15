import { useState } from 'react';
import { Button } from '@/shared/ui/button';

interface Props {
  drawOffered: boolean;
  drawOfferPending: boolean;
  drawDeclined: boolean;
  respondToDraw: (accepted: boolean) => void;
  offerDraw: () => void;
  resign: () => void;
}

export function OnlineGameControls({
  drawOffered,
  drawOfferPending,
  drawDeclined,
  respondToDraw,
  offerDraw,
  resign,
}: Props): React.ReactElement {
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);

  return (
    <>
      {drawOffered ? (
        <>
          <p className="text-xs text-muted-foreground text-center">Opponent offers a draw</p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => respondToDraw(true)}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => respondToDraw(false)}
            >
              Decline
            </Button>
          </div>
        </>
      ) : confirmDraw ? (
        <>
          <p className="text-xs text-muted-foreground text-center">Offer a draw?</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                setConfirmDraw(false);
                offerDraw();
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDraw(false)}
            >
              No
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setConfirmDraw(true)}
            disabled={drawOfferPending}
          >
            {drawOfferPending ? 'Draw offered…' : 'Offer Draw'}
          </Button>
          {drawDeclined && (
            <p className="text-xs text-muted-foreground text-center">
              Opponent declined your draw offer
            </p>
          )}
        </>
      )}
      {confirmResign ? (
        <>
          <p className="text-xs text-muted-foreground text-center">
            Are you sure you want to resign?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setConfirmResign(false);
                resign();
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmResign(false)}
            >
              No
            </Button>
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          className="w-full"
          onClick={() => setConfirmResign(true)}
        >
          Resign
        </Button>
      )}
    </>
  );
}
