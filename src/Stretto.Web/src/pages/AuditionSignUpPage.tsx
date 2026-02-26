import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { formatTime } from '../lib/timeUtils';

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

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

async function fetchAuditionDate(auditionDateId: string): Promise<PublicAuditionDateDto> {
  const res = await fetch(`/api/public/auditions/${auditionDateId}`);
  if (!res.ok) throw new Error('Failed to load audition date');
  return res.json();
}

async function submitSignUp(slotId: string, body: SignUpFormValues): Promise<void> {
  const res = await fetch(`/api/public/auditions/${slotId}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Sign-up failed');
  }
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

function SignUpForm({
  slotId,
  slotTime,
  date,
  onCancel,
}: {
  slotId: string;
  slotTime: string;
  date: string;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) });

  const mutation = useMutation({
    mutationFn: (values: SignUpFormValues) => submitSignUp(slotId, values),
    onSuccess: () => navigate('/auditions/confirmation', { state: { slotTime, date } }),
    onError: (err: Error) => setApiError(err.message),
  });

  function onSubmit(values: SignUpFormValues) {
    setApiError(null);
    mutation.mutate(values);
  }

  return (
    <div className="mt-6 rounded-md border p-4">
      <h2 className="mb-4 text-lg font-medium">Your Details — {formatTime(slotTime)}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium">First Name</label>
          <input data-testid="first-name-input" {...register('firstName')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Last Name</label>
          <input data-testid="last-name-input" {...register('lastName')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input data-testid="email-input" type="email" {...register('email')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        {apiError && <p className="text-sm text-destructive">{apiError}</p>}
        <div className="flex gap-2">
          <button type="submit" data-testid="submit-signup" disabled={isSubmitting || mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            Confirm Sign Up
          </button>
          <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Cancel
          </button>
        </div>
      </form>
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
        <SignUpForm
          slotId={selectedSlot.id}
          slotTime={selectedSlot.slotTime}
          date={data.date}
          onCancel={() => setSelectedSlotId(null)}
        />
      )}
    </div>
  );
}
