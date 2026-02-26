import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '../components/AppShell';
import { EventsService } from '../api/generated/services/EventsService';
import { VenuesService } from '../api/generated/services/VenuesService';

const schema = z.object({
  type: z.enum(['0', '1'], { required_error: 'Type is required' }),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required').regex(/^\d{2}:\d{2}$/, 'Use HH:mm format'),
  durationMinutes: z.coerce.number().int().positive('Duration must be a positive number'),
  venueId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Venue = { id: string; name: string };

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing } = useQuery({
    queryKey: ['event', id],
    queryFn: () => EventsService.getApiEvents1(id!),
    enabled: isEdit,
  });

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: () => VenuesService.getApiVenues(),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({
        type: String(existing.type) as '0' | '1',
        date: existing.date,
        startTime: existing.startTime,
        durationMinutes: existing.durationMinutes,
        venueId: existing.venueId ?? '',
      });
    }
  }, [existing, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        type: Number(values.type) as 0 | 1,
        date: values.date,
        startTime: values.startTime,
        durationMinutes: values.durationMinutes,
        venueId: values.venueId || null,
      };
      if (isEdit) {
        return EventsService.putApiEvents(id!, payload);
      }
      return EventsService.postApiEvents({ ...payload, projectId });
    },
    onSuccess: (result) => {
      const eventId = result?.id ?? id;
      navigate(`/events/${eventId}`);
    },
  });

  const handleCancel = () => {
    const dest = projectId ? `/projects/${projectId}` : '/projects';
    navigate(dest);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Edit Event' : 'Add Event'}</h1>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">Type</label>
            <select id="type" data-testid="type-select" className={inputClass} {...register('type')}>
              <option value="">Select type…</option>
              <option value="0">Rehearsal</option>
              <option value="1">Performance</option>
            </select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="date" className="text-sm font-medium">Date</label>
            <input id="date" type="date" data-testid="date-input" className={inputClass} {...register('date')} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="startTime" className="text-sm font-medium">Start Time</label>
            <input id="startTime" type="time" data-testid="start-time-input" className={inputClass} {...register('startTime')} />
            {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="durationMinutes" className="text-sm font-medium">Duration (minutes)</label>
            <input id="durationMinutes" type="number" data-testid="duration-input" className={inputClass} {...register('durationMinutes')} />
            {errors.durationMinutes && <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="venueId" className="text-sm font-medium">Venue</label>
            <select id="venueId" data-testid="venue-select" className={inputClass} {...register('venueId')}>
              <option value="">No venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              data-testid="submit-button"
              disabled={isSubmitting || saveMutation.isPending}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Save Event
            </button>
            <button
              type="button"
              data-testid="cancel-button"
              onClick={handleCancel}
              className="flex-1 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {saveMutation.isError && (
            <p data-testid="form-error" className="text-destructive text-sm">
              {(saveMutation.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}
