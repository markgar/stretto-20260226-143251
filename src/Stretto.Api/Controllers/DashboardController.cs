using Microsoft.AspNetCore.Mvc;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ProtectedControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService, IAuthService authService)
        : base(authService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] Guid? programYearId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can view the dashboard");

        var dto = programYearId.HasValue
            ? await _dashboardService.GetSummaryAsync(programYearId.Value, orgId)
            : await _dashboardService.GetCurrentSummaryAsync(orgId);

        return Ok(dto);
    }
}
