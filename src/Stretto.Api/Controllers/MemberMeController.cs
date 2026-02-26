using Microsoft.AspNetCore.Mvc;
using Stretto.Application;
using Stretto.Application.DTOs;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/members/me")]
public class MemberMeController : ProtectedControllerBase
{
    private readonly IMemberService _memberService;
    private readonly IMemberCalendarService _calendarService;

    public MemberMeController(IMemberService memberService, IMemberCalendarService calendarService, IAuthService authService)
        : base(authService)
    {
        _memberService = memberService;
        _calendarService = calendarService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMe()
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _memberService.GetMeAsync(memberId, orgId));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMemberProfileRequest req)
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _memberService.UpdateMeAsync(memberId, orgId, req));
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _calendarService.GetProjectsAsync(memberId, orgId));
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendar()
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _calendarService.GetUpcomingEventsAsync(memberId, orgId));
    }

    [HttpGet("calendar.ics")]
    public async Task<IActionResult> GetCalendarIcs()
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        var events = await _calendarService.GetUpcomingEventsAsync(memberId, orgId);
        var icalText = ICalFeedGenerator.Generate(events, "My Stretto Calendar");
        Response.Headers["Content-Disposition"] = "attachment; filename=\"my-calendar.ics\"";
        return Content(icalText, "text/calendar");
    }
}
