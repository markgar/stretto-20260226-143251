import AppShell from '../components/AppShell';
import { useNotificationsForm } from './useNotificationsForm';
import { getErrorMessage } from '../lib/utils';

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function NotificationsPage() {
  const {
    form: { register, handleSubmit, formState: { errors, isSubmitting } },
    watchedType,
    programYearsQuery,
    auditionDatesQuery,
    recipientsQuery,
    sendMutation,
    handlePreview,
  } = useNotificationsForm();

  return (
    <AppShell>
      <div className="p-6 max-w-2xl">
        <h1 data-testid="notifications-heading" className="text-2xl font-semibold mb-6">
          Notifications
        </h1>

        <form onSubmit={handleSubmit((v) => sendMutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium">Announcement Type</label>
            <select id="type" data-testid="type-select" className={inputClass} {...register('type')}>
              <option value="assignment">Assignment Announcement</option>
              <option value="audition">Audition Announcement</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="targetId" className="text-sm font-medium">
              {watchedType === 'assignment' ? 'Program Year' : 'Audition Date'}
            </label>
            <select id="targetId" data-testid="target-select" className={inputClass} {...register('targetId')}>
              <option value="">Select…</option>
              {watchedType === 'assignment'
                ? (programYearsQuery.data ?? []).map((py: { id: string; name: string }) => (
                    <option key={py.id} value={py.id}>{py.name}</option>
                  ))
                : (auditionDatesQuery.data ?? []).map((ad: { id: string; date: string }) => (
                    <option key={ad.id} value={ad.id}>{ad.date}</option>
                  ))}
            </select>
            {errors.targetId && <p className="text-sm text-destructive">{errors.targetId.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
            <input id="subject" data-testid="subject-input" className={inputClass} {...register('subject')} />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="body" className="text-sm font-medium">Body</label>
            <textarea
              id="body"
              data-testid="body-input"
              rows={6}
              className={inputClass}
              {...register('body')}
            />
            {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              data-testid="preview-recipients-button"
              onClick={handlePreview}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Preview Recipients
            </button>
            <button
              type="submit"
              data-testid="send-button"
              disabled={isSubmitting || sendMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Send Announcement
            </button>
          </div>

          {sendMutation.isSuccess && (
            <p data-testid="send-success" className="text-sm text-green-600">
              Announcement sent successfully.
            </p>
          )}
          {sendMutation.isError && (
            <p data-testid="send-error" className="text-sm text-destructive">
              {getErrorMessage(sendMutation.error)}
            </p>
          )}
        </form>

        {recipientsQuery.isLoading && (
          <p className="mt-4 text-muted-foreground text-sm">Loading recipients…</p>
        )}
        {recipientsQuery.isError && (
          <p data-testid="recipients-error" className="mt-4 text-sm text-destructive">
            {getErrorMessage(recipientsQuery.error)}
          </p>
        )}
        {recipientsQuery.data && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">
              Recipients ({(recipientsQuery.data as { memberId: string; name: string; email: string }[]).length})
            </h2>
            <ul data-testid="recipients-list" className="space-y-1 text-sm">
              {(recipientsQuery.data as { memberId: string; name: string; email: string }[]).map((r) => (
                <li key={r.memberId} data-testid={`recipient-${r.memberId}`}>
                  {r.name} — {r.email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
