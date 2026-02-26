import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '../components/AppShell';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Venue = FormValues & { id: string };

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { data: venue } = useQuery<Venue>({
    queryKey: ['venue', id],
    queryFn: () =>
      fetch(`/api/venues/${id}`, { credentials: 'include' }).then((r) => r.json()),
    enabled: isEdit,
  });

  useEffect(() => {
    if (venue) reset(venue);
  }, [venue, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const url = isEdit ? `/api/venues/${id}` : '/api/venues';
      const method = isEdit ? 'PUT' : 'POST';
      return fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => navigate('/venues'),
  });

  function onSubmit(values: FormValues) {
    saveMutation.mutate(values);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Edit Venue' : 'Add Venue'}</h1>
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
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <input
              id="address"
              data-testid="address-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="contactName" className="text-sm font-medium">
              Contact Name
            </label>
            <input
              id="contactName"
              data-testid="contact-name-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('contactName')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="contactEmail" className="text-sm font-medium">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              data-testid="contact-email-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('contactEmail')}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="contactPhone" className="text-sm font-medium">
              Contact Phone
            </label>
            <input
              id="contactPhone"
              data-testid="contact-phone-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('contactPhone')}
            />
          </div>

          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting || saveMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Save Venue
          </button>
        </form>
      </div>
    </AppShell>
  );
}
