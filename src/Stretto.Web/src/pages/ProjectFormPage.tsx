import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '../components/AppShell';
import { ProjectsService } from '../api/generated/services/ProjectsService';
import { getErrorMessage } from '../lib/utils';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const programYearId = searchParams.get('programYearId') ?? '';
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing } = useQuery({
    queryKey: ['project', id],
    queryFn: () => ProjectsService.getApiProjects1(id!),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({ name: existing.name, startDate: existing.startDate, endDate: existing.endDate });
    }
  }, [existing, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? ProjectsService.putApiProjects(id!, values)
        : ProjectsService.postApiProjects({ ...values, programYearId }),
    onSuccess: (result) => {
      const projectId = result?.id ?? id;
      navigate(`/projects/${projectId}`);
    },
  });

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Edit Project' : 'Add Project'}</h1>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input id="name" data-testid="name-input" className={inputClass} {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
            <input id="startDate" type="date" data-testid="start-date-input" className={inputClass} {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
            <input id="endDate" type="date" data-testid="end-date-input" className={inputClass} {...register('endDate')} />
            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              data-testid="submit-button"
              disabled={isSubmitting || saveMutation.isPending}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Save Project
            </button>
            <button
              type="button"
              data-testid="cancel-button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {saveMutation.isError && (
            <p data-testid="form-error" className="text-destructive text-sm">
              {getErrorMessage(saveMutation.error)}
            </p>
          )}
        </form>
      </div>
    </AppShell>
  );
}
