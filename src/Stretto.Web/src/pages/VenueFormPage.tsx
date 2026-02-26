import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useVenueForm } from './useVenueForm';

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const {
    form: { register, handleSubmit, formState: { errors, isSubmitting } },
    isEdit,
    saveMutation,
  } = useVenueForm(id);

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Edit Venue' : 'Add Venue'}</h1>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input id="name" data-testid="name-input" className={inputClass} {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <input id="address" data-testid="address-input" className={inputClass} {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
            <input id="contactName" data-testid="contact-name-input" className={inputClass} {...register('contactName')} />
          </div>
          <div className="space-y-1">
            <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</label>
            <input id="contactEmail" type="email" data-testid="contact-email-input" className={inputClass} {...register('contactEmail')} />
            {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone</label>
            <input id="contactPhone" data-testid="contact-phone-input" className={inputClass} {...register('contactPhone')} />
          </div>
          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting || saveMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Save Venue
          </button>
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
