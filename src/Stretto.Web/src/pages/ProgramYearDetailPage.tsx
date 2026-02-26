import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useProgramYearDetail } from './useProgramYearDetail';

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function ProgramYearDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, form, saveMutation, archiveMutation, activateMutation } = useProgramYearDetail(id);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <AppShell>
      <div className="p-6 max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">{data?.name ?? 'Program Year'}</h1>

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
            <button data-testid="archive-button" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending} className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
              Archive
            </button>
          )}
          {data && !data.isCurrent && !data.isArchived && (
            <button data-testid="activate-button" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
              Activate
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
