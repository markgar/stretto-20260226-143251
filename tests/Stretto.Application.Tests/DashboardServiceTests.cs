using Microsoft.EntityFrameworkCore;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for DashboardService — verifies current summary, queried summary,
/// upcoming events, recent member activity, and recent assignment activity using
/// real repositories backed by an in-memory database.
/// </summary>
public class DashboardServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
    private readonly AppDbContext _db;
    private readonly DashboardService _service;

    public DashboardServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("DashboardServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        _service = new DashboardService(
            new BaseRepository<ProgramYear>(_db),
            new BaseRepository<Project>(_db),
            new BaseRepository<Event>(_db),
            new BaseRepository<Venue>(_db),
            new BaseRepository<Member>(_db),
            new BaseRepository<ProjectAssignment>(_db));
    }

    public void Dispose() => _db.Dispose();

    private async Task<ProgramYear> SeedProgramYearAsync(bool isCurrent = true)
    {
        var year = new ProgramYear
        {
            Id = Guid.NewGuid(),
            Name = "2025-2026",
            StartDate = new DateOnly(2025, 9, 1),
            EndDate = new DateOnly(2026, 6, 30),
            IsCurrent = isCurrent,
            IsArchived = false,
            OrganizationId = OrgId
        };
        _db.ProgramYears.Add(year);
        await _db.SaveChangesAsync();
        return year;
    }

    private async Task<Project> SeedProjectAsync(Guid programYearId)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Spring Concert",
            ProgramYearId = programYearId,
            StartDate = new DateOnly(2025, 10, 1),
            EndDate = new DateOnly(2026, 5, 31),
            OrganizationId = OrgId
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project;
    }

    private async Task<Member> SeedMemberAsync(DateTime? createdAt = null)
    {
        var member = new Member
        {
            Id = Guid.NewGuid(),
            FirstName = "Jane",
            LastName = "Doe",
            Email = $"jane-{Guid.NewGuid()}@example.com",
            Role = Role.Member,
            IsActive = true,
            CreatedAt = createdAt ?? DateTime.UtcNow,
            OrganizationId = OrgId
        };
        _db.Members.Add(member);
        await _db.SaveChangesAsync();
        return member;
    }

    // GetCurrentSummaryAsync

    [Fact]
    public async Task GetCurrentSummaryAsync_returns_empty_dto_when_no_current_program_year()
    {
        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Null(result.ProgramYearId);
        Assert.Null(result.ProgramYearName);
        Assert.Empty(result.UpcomingEvents);
        Assert.Empty(result.RecentActivity);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_returns_program_year_id_and_name_when_current_year_exists()
    {
        var year = await SeedProgramYearAsync(isCurrent: true);

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Equal(year.Id, result.ProgramYearId);
        Assert.Equal(year.Name, result.ProgramYearName);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_includes_upcoming_events_within_30_days()
    {
        var year = await SeedProgramYearAsync();
        var project = await SeedProjectAsync(year.Id);
        var upcomingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
        _db.Events.Add(new Event
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            EventType = EventType.Rehearsal,
            Date = upcomingDate,
            StartTime = new TimeOnly(18, 0),
            DurationMinutes = 90,
            OrganizationId = OrgId
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Single(result.UpcomingEvents);
        Assert.Equal(project.Id, result.UpcomingEvents[0].ProjectId);
        Assert.Equal("Spring Concert", result.UpcomingEvents[0].ProjectName);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_excludes_events_more_than_30_days_out()
    {
        var year = await SeedProgramYearAsync();
        var project = await SeedProjectAsync(year.Id);
        _db.Events.Add(new Event
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            EventType = EventType.Performance,
            Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(45)),
            StartTime = new TimeOnly(19, 0),
            DurationMinutes = 120,
            OrganizationId = OrgId
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Empty(result.UpcomingEvents);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_includes_members_added_within_14_days()
    {
        var year = await SeedProgramYearAsync();
        await SeedMemberAsync(createdAt: DateTime.UtcNow.AddDays(-7));

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Single(result.RecentActivity);
        Assert.Equal("NewMember", result.RecentActivity[0].ActivityType);
        Assert.Contains("joined as a member", result.RecentActivity[0].Description);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_excludes_members_added_more_than_14_days_ago()
    {
        var year = await SeedProgramYearAsync();
        await SeedMemberAsync(createdAt: DateTime.UtcNow.AddDays(-20));

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Empty(result.RecentActivity);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_includes_assignments_added_within_14_days()
    {
        var year = await SeedProgramYearAsync();
        var project = await SeedProjectAsync(year.Id);
        var member = await SeedMemberAsync();
        _db.ProjectAssignments.Add(new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            MemberId = member.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            OrganizationId = OrgId
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        var assignment = result.RecentActivity.FirstOrDefault(a => a.ActivityType == "NewAssignment");
        Assert.NotNull(assignment);
        Assert.Contains("assigned to", assignment.Description);
        Assert.Contains("Spring Concert", assignment.Description);
    }

    [Fact]
    public async Task GetCurrentSummaryAsync_orders_recent_activity_descending_by_occurred_at()
    {
        var year = await SeedProgramYearAsync();
        await SeedMemberAsync(createdAt: DateTime.UtcNow.AddDays(-10));
        await SeedMemberAsync(createdAt: DateTime.UtcNow.AddDays(-2));

        var result = await _service.GetCurrentSummaryAsync(OrgId);

        Assert.Equal(2, result.RecentActivity.Count);
        Assert.True(result.RecentActivity[0].OccurredAt > result.RecentActivity[1].OccurredAt);
    }

    // GetSummaryAsync

    [Fact]
    public async Task GetSummaryAsync_throws_NotFoundException_for_unknown_program_year()
    {
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetSummaryAsync(Guid.NewGuid(), OrgId));
        Assert.Contains("Program year not found", ex.Message);
    }

    [Fact]
    public async Task GetSummaryAsync_returns_summary_for_known_program_year()
    {
        var year = await SeedProgramYearAsync(isCurrent: false);

        var result = await _service.GetSummaryAsync(year.Id, OrgId);

        Assert.Equal(year.Id, result.ProgramYearId);
        Assert.Equal(year.Name, result.ProgramYearName);
    }
}
