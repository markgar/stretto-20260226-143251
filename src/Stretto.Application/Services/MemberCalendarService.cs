using Stretto.Application.DTOs;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class MemberCalendarService : IMemberCalendarService
{
    private readonly IRepository<ProjectAssignment> _assignments;
    private readonly IRepository<Event> _events;
    private readonly IRepository<Project> _projects;
    private readonly IRepository<Venue> _venues;

    public MemberCalendarService(
        IRepository<ProjectAssignment> assignments,
        IRepository<Event> events,
        IRepository<Project> projects,
        IRepository<Venue> venues)
    {
        _assignments = assignments;
        _events = events;
        _projects = projects;
        _venues = venues;
    }

    public async Task<List<MemberProjectSummaryDto>> GetProjectsAsync(Guid memberId, Guid orgId)
    {
        var assignments = await _assignments.ListAsync(orgId, a => a.MemberId == memberId);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var result = new List<MemberProjectSummaryDto>();

        foreach (var assignment in assignments)
        {
            var project = await _projects.GetByIdAsync(assignment.ProjectId, orgId);
            if (project is null)
                continue;

            var upcomingEvents = await _events.ListAsync(orgId, e => e.ProjectId == project.Id && e.Date >= today);
            result.Add(new MemberProjectSummaryDto(
                project.Id,
                project.Name,
                project.StartDate,
                project.EndDate,
                upcomingEvents.Count));
        }

        return result.OrderBy(p => p.ProjectName).ToList();
    }

    public async Task<List<CalendarEventDto>> GetUpcomingEventsAsync(Guid memberId, Guid orgId)
    {
        var assignments = await _assignments.ListAsync(orgId, a => a.MemberId == memberId);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var venues = await _venues.ListAsync(orgId);
        var venueMap = venues.ToDictionary(v => v.Id, v => v.Name);
        var result = new List<CalendarEventDto>();

        foreach (var assignment in assignments)
        {
            var project = await _projects.GetByIdAsync(assignment.ProjectId, orgId);
            if (project is null)
                continue;

            var events = await _events.ListAsync(orgId, e => e.ProjectId == project.Id && e.Date >= today);
            foreach (var ev in events)
            {
                var venueName = ev.VenueId.HasValue && venueMap.TryGetValue(ev.VenueId.Value, out var name) ? name : null;
                result.Add(new CalendarEventDto(
                    ev.Id,
                    project.Id,
                    project.Name,
                    ev.EventType.ToString(),
                    ev.Date,
                    ev.StartTime,
                    ev.DurationMinutes,
                    venueName));
            }
        }

        return result
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .ToList();
    }
}
