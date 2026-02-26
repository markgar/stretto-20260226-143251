import { useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { formatTime } from '../lib/timeUtils';

type ConfirmationState = {
  slotTime?: string;
  date?: string;
};

export default function AuditionConfirmationPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmationState;
  const { slotTime, date } = state;

  const formattedDate = date ? format(parseISO(date), 'MMMM d, yyyy') : null;
  const formattedTime = slotTime ? formatTime(slotTime) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">You're signed up!</h1>
        {formattedDate && formattedTime && (
          <p className="mb-4 text-muted-foreground">
            {formattedDate} at {formattedTime}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Please arrive a few minutes early.</p>
      </div>
    </div>
  );
}
