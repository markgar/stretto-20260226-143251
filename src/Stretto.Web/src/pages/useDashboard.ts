import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../api/generated/services/DashboardService';
import type { DashboardSummaryDto } from '../api/generated/models/DashboardSummaryDto';

export function useDashboard(selectedYearId: string) {
  const { data: summary, isLoading } = useQuery<DashboardSummaryDto>({
    queryKey: ['dashboard', selectedYearId],
    queryFn: () => DashboardService.getApiDashboardSummary(selectedYearId || undefined),
  });

  return { summary, isLoading };
}
