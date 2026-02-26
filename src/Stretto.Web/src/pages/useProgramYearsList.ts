import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgramYearsService } from '../api/generated/services/ProgramYearsService';

type ProgramYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
};

export function useProgramYearsList() {
  const queryClient = useQueryClient();

  const { data: programYears = [] } = useQuery<ProgramYear[]>({
    queryKey: ['program-years'],
    queryFn: () => ProgramYearsService.getApiProgramYears(),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => ProgramYearsService.postApiProgramYearsArchive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-years'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => ProgramYearsService.postApiProgramYearsActivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program-years'] }),
  });

  return { programYears, archiveMutation, activateMutation };
}
