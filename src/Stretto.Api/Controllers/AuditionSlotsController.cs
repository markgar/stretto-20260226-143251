using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/audition-slots")]
<<<<<<< HEAD
public class AuditionSlotsController : ProtectedControllerBase
{
    private readonly IAuditionService _auditionService;

    public AuditionSlotsController(IAuditionService auditionService, IAuthService authService)
        : base(authService)
    {
        _auditionService = auditionService;
=======
public class AuditionSlotsController : ControllerBase
{
    private readonly IAuditionService _auditionService;
    private readonly IAuthService _authService;

    public AuditionSlotsController(IAuditionService auditionService, IAuthService authService)
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
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? auditionDateId)
    {
<<<<<<< HEAD
        var (orgId, _, _) = await GetSessionAsync();
        if (auditionDateId is null)
            return BadRequest(new { message = "auditionDateId query parameter is required" });
        var dto = await _auditionService.GetAsync(auditionDateId.Value, orgId);
        return Ok(dto.Slots);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSlotStatusRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot status");
        var dto = await _auditionService.UpdateSlotStatusAsync(id, orgId, req.Status);
        return Ok(dto);
    }

    [HttpPut("{id:guid}/notes")]
    public async Task<IActionResult> UpdateNotes(Guid id, [FromBody] UpdateSlotNotesRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update slot notes");
        var dto = await _auditionService.UpdateSlotNotesAsync(id, orgId, req.Notes);
=======
        var (orgId, _) = await GetSessionAsync();
        if (auditionDateId is null)
            return BadRequest(new { message = "auditionDateId query parameter is required" });
        var date = await _auditionService.GetAsync(auditionDateId.Value, orgId);
        return Ok(date.Slots);
    }

    [HttpPut("{slotId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid slotId, [FromBody] UpdateSlotStatusRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update audition slot status");
        var dto = await _auditionService.UpdateSlotStatusAsync(slotId, orgId, req.Status);
        return Ok(dto);
    }

    [HttpPut("{slotId:guid}/notes")]
    public async Task<IActionResult> UpdateNotes(Guid slotId, [FromBody] UpdateSlotNotesRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update audition slot notes");
        var dto = await _auditionService.UpdateSlotNotesAsync(slotId, orgId, req.Notes);
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        return Ok(dto);
    }
}
