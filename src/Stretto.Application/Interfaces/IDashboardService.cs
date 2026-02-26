using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetCurrentSummaryAsync(Guid orgId);
    Task<DashboardSummaryDto> GetSummaryAsync(Guid programYearId, Guid orgId);
}
