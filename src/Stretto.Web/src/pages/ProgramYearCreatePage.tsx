import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import AppShell from '../components/AppShell';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type FormValues = z.infer<typeof schema>;

export default function ProgramYearCreatePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      fetch('/api/program-years', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }),
    onSuccess: () => navigate('/program-years'),
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">New Program Year</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              data-testid="name-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="startDate" className="text-sm font-medium">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              data-testid="start-date-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('startDate')}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="endDate" className="text-sm font-medium">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              data-testid="end-date-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('endDate')}
            />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            )}
          </div>

          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Create Program Year
          </button>
        </form>
      </div>
    </AppShell>
  );
}
