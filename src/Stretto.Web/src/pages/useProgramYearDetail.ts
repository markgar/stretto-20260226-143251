import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProgramYearsService } from '../api/generated/services/ProgramYearsService';

export const programYearSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export type ProgramYearFormValues = z.infer<typeof programYearSchema>;

type ProgramYear = ProgramYearFormValues & {
  id: string;
  isCurrent: boolean;
  isArchived: boolean;
};

export function useProgramYearDetail(id: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery<ProgramYear>({
    queryKey: ['program-year', id],
    queryFn: () => ProgramYearsService.getApiProgramYears1(id!),
    enabled: Boolean(id),
  });

  const form = useForm<ProgramYearFormValues>({ resolver: zodResolver(programYearSchema) });

  useEffect(() => {
    if (data) form.reset({ name: data.name, startDate: data.startDate, endDate: data.endDate });
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: ProgramYearFormValues) =>
      ProgramYearsService.putApiProgramYears(id!, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-year', id] }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => ProgramYearsService.postApiProgramYearsArchive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-years'] });
      navigate('/program-years');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => ProgramYearsService.postApiProgramYearsActivate(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-year', id] }),
  });

  return { data, form, saveMutation, archiveMutation, activateMutation };
}
