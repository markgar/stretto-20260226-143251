using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ProtectedControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications, IAuthService authService)
        : base(authService)
    {
        _notifications = notifications;
    }

    [HttpGet("assignment-recipients")]
    public async Task<IActionResult> GetAssignmentRecipients([FromQuery] Guid programYearId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can view recipients");
        var recipients = await _notifications.GetAssignmentRecipientsAsync(programYearId, orgId);
        return Ok(recipients);
    }

    [HttpPost("assignment-announcement")]
    public async Task<IActionResult> SendAssignmentAnnouncement([FromBody] SendAssignmentAnnouncementRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can send announcements");
        await _notifications.SendAssignmentAnnouncementAsync(req.ProgramYearId, req.Subject, req.Body, orgId);
        return NoContent();
    }

    [HttpGet("audition-recipients")]
    public async Task<IActionResult> GetAuditionRecipients([FromQuery] Guid auditionDateId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can view recipients");
        var recipients = await _notifications.GetAuditionRecipientsAsync(auditionDateId, orgId);
        return Ok(recipients);
    }

    [HttpPost("audition-announcement")]
    public async Task<IActionResult> SendAuditionAnnouncement([FromBody] SendAuditionAnnouncementRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can send announcements");
        await _notifications.SendAuditionAnnouncementAsync(req.AuditionDateId, req.Subject, req.Body, orgId);
        return NoContent();
    }
}
