import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '../components/AppShell';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type FormValues = z.infer<typeof schema>;

type ProgramYear = FormValues & {
  id: string;
  isCurrent: boolean;
  isArchived: boolean;
};

export default function ProgramYearDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery<ProgramYear>({
    queryKey: ['program-year', id],
    queryFn: () =>
      fetch(`/api/program-years/${id}`, { credentials: 'include' }).then((r) => r.json()),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      fetch(`/api/program-years/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-year', id] }),
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/program-years/${id}/archive`, {
        method: 'POST',
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-years'] });
      navigate('/program-years');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/program-years/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-year', id] }),
  });

  function onSubmit(values: FormValues) {
    saveMutation.mutate(values);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">{data?.name ?? 'Program Year'}</h1>

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
            data-testid="save-button"
            disabled={isSubmitting || saveMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Save
          </button>
        </form>

        <div className="flex gap-3">
          {data && !data.isArchived && (
            <button
              data-testid="archive-button"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              Archive
            </button>
          )}
          {data && !data.isCurrent && !data.isArchived && (
            <button
              data-testid="activate-button"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              Activate
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
