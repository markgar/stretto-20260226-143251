using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/audition-dates")]
public class AuditionsController : ControllerBase
{
    private readonly IAuditionService _auditionService;
    private readonly IAuthService _authService;

    public AuditionsController(IAuditionService auditionService, IAuthService authService)
    {
        _auditionService = auditionService;
        _authService = authService;
    }

    private async Task<(Guid orgId, string role)> GetSessionAsync()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is null)
            throw new UnauthorizedException();
        var dto = await _authService.ValidateAsync(token);
        if (dto is null)
            throw new UnauthorizedException();
        return (dto.OrgId, dto.Role);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid programYearId)
    {
        var (orgId, _) = await GetSessionAsync();
        var list = await _auditionService.ListByProgramYearAsync(programYearId, orgId);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditionDateRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create audition dates");
        var dto = await _auditionService.CreateAsync(orgId, req);
        return Created($"/api/audition-dates/{dto.Id}", dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _) = await GetSessionAsync();
        var dto = await _auditionService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete audition dates");
        await _auditionService.DeleteAsync(id, orgId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/slots/{slotId:guid}/status")]
    public async Task<IActionResult> UpdateSlotStatus(Guid id, Guid slotId, [FromBody] UpdateSlotStatusRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot status");
        var dto = await _auditionService.UpdateSlotStatusAsync(id, slotId, orgId, req.Status);
        return Ok(dto);
    }

    [HttpPatch("{id:guid}/slots/{slotId:guid}/notes")]
    public async Task<IActionResult> UpdateSlotNotes(Guid id, Guid slotId, [FromBody] UpdateSlotNotesRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot notes");
        var dto = await _auditionService.UpdateSlotNotesAsync(id, slotId, orgId, req.Notes);
        return Ok(dto);
    }
}
