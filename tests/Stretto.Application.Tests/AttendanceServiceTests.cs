using Microsoft.EntityFrameworkCore;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Tests for AttendanceService — verifies GetForEvent, SetStatus, CheckIn,
/// and ToggleExcused business logic using real repositories backed by an in-memory database.
/// </summary>
public class AttendanceServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("AAAA0000-0000-0000-0000-000000000000");
    private static readonly Guid OtherOrgId = Guid.Parse("BBBB0000-0000-0000-0000-000000000000");

    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("AttendanceServiceTests-" + Guid.NewGuid())
            .Options);

    private static AttendanceService CreateService(AppDbContext ctx) =>
        new(
            new BaseRepository<Event>(ctx),
            new BaseRepository<ProjectAssignment>(ctx),
            new BaseRepository<AttendanceRecord>(ctx),
            new BaseRepository<Member>(ctx));

    private static Event MakeEvent(Guid projectId, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        ProjectId = projectId,
        OrganizationId = orgId ?? OrgId,
        EventType = EventType.Rehearsal,
        Date = new DateOnly(2025, 3, 1),
        StartTime = new TimeOnly(18, 0),
        DurationMinutes = 120
    };

    private static Member MakeMember(string first, string last, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        FirstName = first,
        LastName = last,
        Email = $"{first.ToLower()}@example.com",
        Role = Role.Member,
        IsActive = true,
        OrganizationId = orgId ?? OrgId
    };

    private static ProjectAssignment MakeAssignment(Guid projectId, Guid memberId, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        ProjectId = projectId,
        MemberId = memberId,
        OrganizationId = orgId ?? OrgId
    };

    // GetForEventAsync

    [Fact]
    public async Task GetForEventAsync_throws_NotFoundException_when_event_does_not_exist()
    {
        var ctx = CreateContext();
        var service = CreateService(ctx);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetForEventAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetForEventAsync_returns_all_assigned_members_with_null_status_when_no_records()
    {
        var ctx = CreateContext();
        var projectId = Guid.NewGuid();
        var alice = MakeMember("Alice", "Alto");
        var bob = MakeMember("Bob", "Bass");
        var ev = MakeEvent(projectId);

        ctx.Events.Add(ev);
        ctx.Members.AddRange(alice, bob);
        ctx.ProjectAssignments.AddRange(
            MakeAssignment(projectId, alice.Id),
            MakeAssignment(projectId, bob.Id));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetForEventAsync(ev.Id, OrgId);

        Assert.Equal(2, result.Count);
        Assert.All(result, item => Assert.Null(item.Status));
        Assert.Contains(result, item => item.MemberName == "Alice Alto");
        Assert.Contains(result, item => item.MemberName == "Bob Bass");
    }

    [Fact]
    public async Task GetForEventAsync_returns_status_when_attendance_record_exists()
    {
        var ctx = CreateContext();
        var projectId = Guid.NewGuid();
        var alice = MakeMember("Alice", "Alto");
        var ev = MakeEvent(projectId);

        ctx.Events.Add(ev);
        ctx.Members.Add(alice);
        ctx.ProjectAssignments.Add(MakeAssignment(projectId, alice.Id));
        ctx.AttendanceRecords.Add(new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            EventId = ev.Id,
            MemberId = alice.Id,
            Status = AttendanceStatus.Present,
            OrganizationId = OrgId
        });
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetForEventAsync(ev.Id, OrgId);

        var item = Assert.Single(result);
        Assert.Equal("Present", item.Status);
    }

    [Fact]
    public async Task GetForEventAsync_excludes_members_not_assigned_to_project()
    {
        var ctx = CreateContext();
        var projectId = Guid.NewGuid();
        var otherProjectId = Guid.NewGuid();
        var assigned = MakeMember("Assigned", "Member");
        var unassigned = MakeMember("Other", "Member");
        var ev = MakeEvent(projectId);

        ctx.Events.Add(ev);
        ctx.Members.AddRange(assigned, unassigned);
        ctx.ProjectAssignments.Add(MakeAssignment(projectId, assigned.Id));
        ctx.ProjectAssignments.Add(MakeAssignment(otherProjectId, unassigned.Id));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetForEventAsync(ev.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("Assigned Member", result[0].MemberName);
    }

    [Fact]
    public async Task GetForEventAsync_does_not_return_event_from_different_org()
    {
        var ctx = CreateContext();
        var ev = MakeEvent(Guid.NewGuid(), orgId: OtherOrgId);

        ctx.Events.Add(ev);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).GetForEventAsync(ev.Id, OrgId));
    }

    // SetStatusAsync

    [Fact]
    public async Task SetStatusAsync_creates_new_record_when_none_exists()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var service = CreateService(ctx);

        var result = await service.SetStatusAsync(eventId, memberId, OrgId, AttendanceStatus.Present);

        Assert.Equal(eventId, result.EventId);
        Assert.Equal(memberId, result.MemberId);
        Assert.Equal("Present", result.Status);
        Assert.Single(ctx.AttendanceRecords);
    }

    [Fact]
    public async Task SetStatusAsync_updates_existing_record_instead_of_creating_duplicate()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var existing = new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            MemberId = memberId,
            Status = AttendanceStatus.Absent,
            OrganizationId = OrgId
        };
        ctx.AttendanceRecords.Add(existing);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).SetStatusAsync(eventId, memberId, OrgId, AttendanceStatus.Excused);

        Assert.Equal("Excused", result.Status);
        Assert.Equal(existing.Id, result.Id);
        Assert.Single(ctx.AttendanceRecords);
    }

    // CheckInAsync

    [Fact]
    public async Task CheckInAsync_sets_status_to_Present()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        var result = await CreateService(ctx).CheckInAsync(eventId, memberId, OrgId);

        Assert.Equal("Present", result.Status);
    }

    // ToggleExcusedAsync

    [Fact]
    public async Task ToggleExcusedAsync_sets_Excused_when_no_existing_record()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        var result = await CreateService(ctx).ToggleExcusedAsync(eventId, memberId, OrgId);

        Assert.Equal("Excused", result.Status);
    }

    [Fact]
    public async Task ToggleExcusedAsync_sets_Excused_when_currently_Absent()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        ctx.AttendanceRecords.Add(new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            MemberId = memberId,
            Status = AttendanceStatus.Absent,
            OrganizationId = OrgId
        });
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ToggleExcusedAsync(eventId, memberId, OrgId);

        Assert.Equal("Excused", result.Status);
    }

    [Fact]
    public async Task ToggleExcusedAsync_sets_Absent_when_currently_Excused()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        ctx.AttendanceRecords.Add(new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            MemberId = memberId,
            Status = AttendanceStatus.Excused,
            OrganizationId = OrgId
        });
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ToggleExcusedAsync(eventId, memberId, OrgId);

        Assert.Equal("Absent", result.Status);
    }

    [Fact]
    public async Task ToggleExcusedAsync_sets_Excused_when_currently_Present()
    {
        var ctx = CreateContext();
        var eventId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        ctx.AttendanceRecords.Add(new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            MemberId = memberId,
            Status = AttendanceStatus.Present,
            OrganizationId = OrgId
        });
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ToggleExcusedAsync(eventId, memberId, OrgId);

        Assert.Equal("Excused", result.Status);
    }
}
