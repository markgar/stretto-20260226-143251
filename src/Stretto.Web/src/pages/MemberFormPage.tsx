import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '../components/AppShell';

const createSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['Admin', 'Member']),
});

const editSchema = createSchema.extend({
  isActive: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

type MemberDto = EditFormValues & { id: string };

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { isActive: true },
  });

  const { data: member } = useQuery<MemberDto>({
    queryKey: ['member', id],
    queryFn: () =>
      fetch(`/api/members/${id}`, { credentials: 'include' }).then((r) => r.json()),
    enabled: isEdit,
  });

  useEffect(() => {
    if (member) reset(member);
  }, [member, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const url = isEdit ? `/api/members/${id}` : '/api/members';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message ?? 'Request failed');
      }
      return response.json() as Promise<MemberDto>;
    },
    onSuccess: (dto) => navigate(`/members/${dto.id ?? id}`),
  });

  function onSubmit(values: EditFormValues) {
    saveMutation.mutate(values);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">
          {isEdit ? 'Edit Member' : 'Add Member'}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </label>
            <input
              id="firstName"
              data-testid="first-name-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <input
              id="lastName"
              data-testid="last-name-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="email-input"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              data-testid="role-select"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('role')}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                data-testid="is-active-checkbox"
                {...register('isActive')}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
          )}

          {saveMutation.isError && (
            <p data-testid="form-error" className="text-destructive text-sm">
              {(saveMutation.error as Error).message}
            </p>
          )}

          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting || saveMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isEdit ? 'Save' : 'Add Member'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
