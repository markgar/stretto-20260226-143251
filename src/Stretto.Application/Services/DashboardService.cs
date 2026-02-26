using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<ProgramYear> _programYears;
    private readonly IRepository<Project> _projects;
    private readonly IRepository<Event> _events;
    private readonly IRepository<Venue> _venues;
    private readonly IRepository<Member> _members;
    private readonly IRepository<ProjectAssignment> _assignments;

    public DashboardService(
        IRepository<ProgramYear> programYears,
        IRepository<Project> projects,
        IRepository<Event> events,
        IRepository<Venue> venues,
        IRepository<Member> members,
        IRepository<ProjectAssignment> assignments)
    {
        _programYears = programYears;
        _projects = projects;
        _events = events;
        _venues = venues;
        _members = members;
        _assignments = assignments;
    }

    public async Task<DashboardSummaryDto> GetCurrentSummaryAsync(Guid orgId)
    {
        var years = await _programYears.ListAsync(orgId, y => y.IsCurrent);
        var current = years.FirstOrDefault();
        if (current is null)
            return new DashboardSummaryDto(null, null, [], []);
        return await BuildSummaryAsync(current, orgId);
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid programYearId, Guid orgId)
    {
        var year = await _programYears.GetByIdAsync(programYearId, orgId);
        if (year is null)
            throw new NotFoundException("Program year not found");
        return await BuildSummaryAsync(year, orgId);
    }

    private async Task<DashboardSummaryDto> BuildSummaryAsync(ProgramYear year, Guid orgId)
    {
        var projects = await _projects.ListAsync(orgId, p => p.ProgramYearId == year.Id);
        var projectIds = projects.Select(p => p.Id).ToHashSet();
        var projectMap = projects.ToDictionary(p => p.Id, p => p.Name);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysOut = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));

        var allEvents = await _events.ListAsync(orgId, e =>
            projectIds.Contains(e.ProjectId) &&
            e.Date >= today &&
            e.Date <= thirtyDaysOut);

        var venueList = await _venues.ListAsync(orgId);
        var venueMap = venueList.ToDictionary(v => v.Id, v => v.Name);

        var upcomingEvents = allEvents
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .Select(e =>
            {
                var venueName = e.VenueId.HasValue && venueMap.TryGetValue(e.VenueId.Value, out var vn) ? vn : null;
                var projectName = projectMap.TryGetValue(e.ProjectId, out var pn) ? pn : string.Empty;
                return new UpcomingEventDto(e.Id, e.ProjectId, projectName, e.EventType, e.Date, e.StartTime, e.DurationMinutes, venueName);
            })
            .ToList();

        var cutoff = DateTime.UtcNow.AddDays(-14);

        var recentMembers = await _members.ListAsync(orgId, m => m.CreatedAt >= cutoff);
        var memberActivity = recentMembers
            .Select(m => new RecentActivityItem("NewMember", $"{m.FirstName} {m.LastName} joined as a member", m.CreatedAt))
            .ToList();

        var recentAssignments = await _assignments.ListAsync(orgId, a => a.CreatedAt >= cutoff);
        var memberMap = (await _members.ListAsync(orgId)).ToDictionary(m => m.Id, m => $"{m.FirstName} {m.LastName}");

        var assignmentActivity = recentAssignments
            .Select(a =>
            {
                var memberName = memberMap.TryGetValue(a.MemberId, out var mn) ? mn : "Unknown";
                var projectName = projectMap.TryGetValue(a.ProjectId, out var pn) ? pn : "Unknown";
                return new RecentActivityItem("NewAssignment", $"{memberName} assigned to {projectName}", a.CreatedAt);
            })
            .ToList();

        var recentActivity = memberActivity
            .Concat(assignmentActivity)
            .OrderByDescending(a => a.OccurredAt)
            .ToList();

        return new DashboardSummaryDto(year.Id, year.Name, upcomingEvents, recentActivity);
    }
}
