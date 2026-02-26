using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
public class AttendanceController : ProtectedControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService, IAuthService authService)
        : base(authService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet("api/events/{eventId:guid}/attendance")]
    public async Task<IActionResult> GetForEvent(Guid eventId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can view attendance");
        var list = await _attendanceService.GetForEventAsync(eventId, orgId);
        return Ok(list);
    }

    [HttpPut("api/events/{eventId:guid}/attendance/{memberId:guid}")]
    public async Task<IActionResult> SetStatus(Guid eventId, Guid memberId, [FromBody] SetAttendanceStatusRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can set attendance status");
        var dto = await _attendanceService.SetStatusAsync(eventId, memberId, orgId, req.Status);
        return Ok(dto);
    }

    [HttpPost("api/checkin/{eventId:guid}")]
    public async Task<IActionResult> CheckIn(Guid eventId)
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        var dto = await _attendanceService.CheckInAsync(eventId, memberId, orgId);
        return Ok(dto);
    }

    [HttpPut("api/events/{eventId:guid}/attendance/me/excused")]
    public async Task<IActionResult> ToggleExcused(Guid eventId)
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        var dto = await _attendanceService.ToggleExcusedAsync(eventId, memberId, orgId);
        return Ok(dto);
    }
}
