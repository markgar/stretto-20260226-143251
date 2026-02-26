using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/audition-slots")]
public class AuditionSlotsController : ProtectedControllerBase
{
    private readonly IAuditionService _auditionService;

    public AuditionSlotsController(IAuditionService auditionService, IAuthService authService)
        : base(authService)
    {
        _auditionService = auditionService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? auditionDateId)
    {
        var (orgId, _) = await GetSessionAsync();
        if (auditionDateId is null)
            return BadRequest(new { message = "auditionDateId query parameter is required" });
        var dto = await _auditionService.GetAsync(auditionDateId.Value, orgId);
        return Ok(dto.Slots);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSlotStatusRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot status");
        var dto = await _auditionService.UpdateSlotStatusAsync(id, orgId, req.Status);
        return Ok(dto);
    }

    [HttpPut("{id:guid}/notes")]
    public async Task<IActionResult> UpdateNotes(Guid id, [FromBody] UpdateSlotNotesRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot notes");
        var dto = await _auditionService.UpdateSlotNotesAsync(id, orgId, req.Notes);
        return Ok(dto);
    }
}
