import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

type PublicAuditionSlotDto = {
  id: string;
  slotTime: string;
  isAvailable: boolean;
};

type PublicAuditionDateDto = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  blockLengthMinutes: number;
  slots: PublicAuditionSlotDto[];
};

async function fetchAuditionDate(auditionDateId: string): Promise<PublicAuditionDateDto> {
  const res = await fetch(`/api/public/auditions/${auditionDateId}`);
  if (!res.ok) throw new Error('Failed to load audition date');
  return res.json();
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0);
  return format(d, 'h:mm a');
}

function SlotList({
  slots,
  onSelect,
}: {
  slots: PublicAuditionSlotDto[];
  onSelect: (slotId: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <div key={slot.id} className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm font-medium">{formatTime(slot.slotTime)}</span>
          {slot.isAvailable ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Available</span>
              <button
                data-testid={`signup-${slot.id}`}
                onClick={() => onSelect(slot.id)}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Taken</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditionSignUpPage() {
  const { auditionDateId } = useParams<{ auditionDateId: string }>();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<PublicAuditionDateDto>({
    queryKey: ['public-audition', auditionDateId],
    queryFn: () => fetchAuditionDate(auditionDateId!),
    enabled: !!auditionDateId,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (isError || !data) return <div className="p-8 text-center text-destructive">Could not load audition sign-up page.</div>;

  const formattedDate = format(parseISO(data.date), 'MMMM d, yyyy');
  const timeRange = `${formatTime(data.startTime)} – ${formatTime(data.endTime)}`;
  const selectedSlot = data.slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-2xl font-semibold">Audition Sign-Up</h1>
      <p className="mb-6 text-muted-foreground">{formattedDate} · {timeRange}</p>
      <SlotList slots={data.slots} onSelect={setSelectedSlotId} />
      {selectedSlot && (
        <p className="mt-4 text-sm text-muted-foreground">
          Selected: {formatTime(selectedSlot.slotTime)}
        </p>
      )}
    </div>
  );
}
