import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VenuesService } from '../api/generated/services/VenuesService';

export const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export type VenueFormValues = z.infer<typeof venueSchema>;

export function useVenueForm(id: string | undefined) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const form = useForm<VenueFormValues>({ resolver: zodResolver(venueSchema) });

  const { data: venue } = useQuery<VenueFormValues & { id: string }>({
    queryKey: ['venue', id],
    queryFn: () => VenuesService.getApiVenues1(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (venue) form.reset(venue);
  }, [venue, form]);

  const saveMutation = useMutation({
    mutationFn: (values: VenueFormValues) =>
      isEdit
        ? VenuesService.putApiVenues(id!, values)
        : VenuesService.postApiVenues(values),
    onSuccess: () => navigate('/venues'),
  });

  return { form, isEdit, saveMutation };
}
