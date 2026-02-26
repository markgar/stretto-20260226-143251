using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/audition-dates")]
public class AuditionDatesController : ProtectedControllerBase
{
    private readonly IAuditionService _auditionService;

    public AuditionDatesController(IAuditionService auditionService, IAuthService authService)
        : base(authService)
    {
        _auditionService = auditionService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? programYearId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        if (programYearId is null)
            return BadRequest(new { message = "programYearId query parameter is required" });
        var list = await _auditionService.ListByProgramYearAsync(programYearId.Value, orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _auditionService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditionDateRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
<<<<<<< HEAD
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create audition dates");
=======
>>>>>>> 66fb56e ([validator] Fix build errors and add Playwright tests for milestone 10a: Attendance Backend)
        var dto = await _auditionService.CreateAsync(orgId, req);
        return Created($"/api/audition-dates/{dto.Id}", dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete audition dates");
        await _auditionService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
