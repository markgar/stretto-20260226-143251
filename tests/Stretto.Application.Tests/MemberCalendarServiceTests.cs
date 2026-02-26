using Microsoft.EntityFrameworkCore;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for MemberCalendarService — verifies project summaries and upcoming events
/// using real repositories backed by an in-memory database.
/// </summary>
public class MemberCalendarServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD");
    private readonly AppDbContext _db;
    private readonly MemberCalendarService _service;

    public MemberCalendarServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("MemberCalendarServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        _service = new MemberCalendarService(
            new BaseRepository<ProjectAssignment>(_db),
            new BaseRepository<Event>(_db),
            new BaseRepository<Project>(_db),
            new BaseRepository<Venue>(_db));
    }

    public void Dispose() => _db.Dispose();

    private async Task<Member> SeedMemberAsync(string email = "member@example.com")
    {
        var member = new Member
        {
            Id = Guid.NewGuid(),
            FirstName = "Jane",
            LastName = "Doe",
            Email = email,
            Role = Role.Member,
            IsActive = true,
            OrganizationId = OrgId
        };
        _db.Members.Add(member);
        await _db.SaveChangesAsync();
        return member;
    }

    private async Task<Project> SeedProjectAsync(string name = "Spring Concert")
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = name,
            ProgramYearId = Guid.NewGuid(),
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 12, 31),
            OrganizationId = OrgId
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project;
    }

    private async Task<ProjectAssignment> AssignMemberAsync(Guid memberId, Guid projectId)
    {
        var assignment = new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            MemberId = memberId,
            ProjectId = projectId,
            OrganizationId = OrgId
        };
        _db.ProjectAssignments.Add(assignment);
        await _db.SaveChangesAsync();
        return assignment;
    }

    private async Task<Event> SeedEventAsync(Guid projectId, DateOnly date, TimeOnly? startTime = null, Guid? venueId = null)
    {
        var ev = new Event
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            EventType = EventType.Rehearsal,
            Date = date,
            StartTime = startTime ?? new TimeOnly(18, 30),
            DurationMinutes = 120,
            VenueId = venueId,
            OrganizationId = OrgId
        };
        _db.Events.Add(ev);
        await _db.SaveChangesAsync();
        return ev;
    }

    // GetProjectsAsync

    [Fact]
    public async Task GetProjectsAsync_returns_empty_for_member_with_no_assignments()
    {
        var member = await SeedMemberAsync();

        var result = await _service.GetProjectsAsync(member.Id, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetProjectsAsync_returns_assigned_projects_for_member()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync("Spring Concert");
        await AssignMemberAsync(member.Id, project.Id);

        var result = await _service.GetProjectsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Equal(project.Id, result[0].ProjectId);
        Assert.Equal("Spring Concert", result[0].ProjectName);
    }

    [Fact]
    public async Task GetProjectsAsync_counts_only_upcoming_events()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync();
        await AssignMemberAsync(member.Id, project.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(1));
        await SeedEventAsync(project.Id, today.AddDays(7));
        await SeedEventAsync(project.Id, today.AddDays(-1)); // past event

        var result = await _service.GetProjectsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Equal(2, result[0].UpcomingEventCount);
    }

    [Fact]
    public async Task GetProjectsAsync_returns_projects_sorted_by_name()
    {
        var member = await SeedMemberAsync();
        var projectC = await SeedProjectAsync("Zulu Concert");
        var projectA = await SeedProjectAsync("Alpha Concert");
        var projectB = await SeedProjectAsync("Middle Concert");
        await AssignMemberAsync(member.Id, projectC.Id);
        await AssignMemberAsync(member.Id, projectA.Id);
        await AssignMemberAsync(member.Id, projectB.Id);

        var result = await _service.GetProjectsAsync(member.Id, OrgId);

        Assert.Equal("Alpha Concert", result[0].ProjectName);
        Assert.Equal("Middle Concert", result[1].ProjectName);
        Assert.Equal("Zulu Concert", result[2].ProjectName);
    }

    [Fact]
    public async Task GetProjectsAsync_does_not_return_projects_from_other_org()
    {
        var otherOrgId = Guid.NewGuid();
        var member = await SeedMemberAsync();
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Other Org Project",
            ProgramYearId = Guid.NewGuid(),
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 12, 31),
            OrganizationId = otherOrgId
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        // Member not assigned in OrgId
        var assignment = new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            MemberId = member.Id,
            ProjectId = project.Id,
            OrganizationId = otherOrgId
        };
        _db.ProjectAssignments.Add(assignment);
        await _db.SaveChangesAsync();

        var result = await _service.GetProjectsAsync(member.Id, OrgId);

        Assert.Empty(result);
    }

    // GetUpcomingEventsAsync

    [Fact]
    public async Task GetUpcomingEventsAsync_returns_empty_for_member_with_no_assignments()
    {
        var member = await SeedMemberAsync();

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_returns_upcoming_events_for_assigned_projects()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync("Spring Concert");
        await AssignMemberAsync(member.Id, project.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(3));

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("Spring Concert", result[0].ProjectName);
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_excludes_past_events()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync();
        await AssignMemberAsync(member.Id, project.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(-1));

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_returns_events_sorted_by_date_then_start_time()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync();
        await AssignMemberAsync(member.Id, project.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(5), new TimeOnly(20, 0));
        await SeedEventAsync(project.Id, today.AddDays(2), new TimeOnly(18, 0));
        await SeedEventAsync(project.Id, today.AddDays(2), new TimeOnly(10, 0));

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Equal(3, result.Count);
        Assert.Equal(today.AddDays(2), result[0].Date);
        Assert.Equal(new TimeOnly(10, 0), result[0].StartTime);
        Assert.Equal(today.AddDays(2), result[1].Date);
        Assert.Equal(new TimeOnly(18, 0), result[1].StartTime);
        Assert.Equal(today.AddDays(5), result[2].Date);
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_includes_venue_name_when_event_has_venue()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync();
        await AssignMemberAsync(member.Id, project.Id);
        var venue = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "City Hall",
            Address = "123 Main St",
            OrganizationId = OrgId
        };
        _db.Venues.Add(venue);
        await _db.SaveChangesAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(1), venueId: venue.Id);

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("City Hall", result[0].VenueName);
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_returns_null_venue_name_when_no_venue()
    {
        var member = await SeedMemberAsync();
        var project = await SeedProjectAsync();
        await AssignMemberAsync(member.Id, project.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await SeedEventAsync(project.Id, today.AddDays(1));

        var result = await _service.GetUpcomingEventsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Null(result[0].VenueName);
    }
}
