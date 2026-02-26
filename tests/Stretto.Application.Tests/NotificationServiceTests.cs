using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Tests for NotificationService — verifies recipient filtering and announcement dispatch
/// using real repositories backed by an in-memory database and a fake notification provider.
/// </summary>
public class NotificationServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("aaaa0000-0000-0000-0000-000000000001");
    private static readonly Guid OtherOrgId = Guid.Parse("bbbb0000-0000-0000-0000-000000000002");

    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static (NotificationService service, FakeNotificationProvider provider) CreateService(AppDbContext ctx)
    {
        var provider = new FakeNotificationProvider();
        var service = new NotificationService(
            provider,
            new BaseRepository<Member>(ctx),
            new BaseRepository<ProjectAssignment>(ctx),
            new BaseRepository<Project>(ctx),
            new BaseRepository<AuditionDate>(ctx));
        return (service, provider);
    }

    private static Member MakeMember(
        string firstName = "Alice",
        string lastName = "Soprano",
        string email = "alice@choir.org",
        bool isActive = true,
        bool notificationsEnabled = true,
        Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        Email = email,
        Role = Role.Member,
        IsActive = isActive,
        NotificationsEnabled = notificationsEnabled,
        OrganizationId = orgId ?? OrgId
    };

    private static Project MakeProject(Guid programYearId, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Spring Concert",
        ProgramYearId = programYearId,
        StartDate = DateOnly.FromDateTime(DateTime.Today),
        EndDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(3)),
        OrganizationId = orgId ?? OrgId
    };

    private static ProjectAssignment MakeAssignment(Guid projectId, Guid memberId, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        ProjectId = projectId,
        MemberId = memberId,
        OrganizationId = orgId ?? OrgId
    };

    private static AuditionDate MakeAuditionDate(Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        ProgramYearId = Guid.NewGuid(),
        Date = DateOnly.FromDateTime(DateTime.Today.AddDays(7)),
        StartTime = new TimeOnly(10, 0),
        EndTime = new TimeOnly(12, 0),
        BlockLengthMinutes = 15,
        OrganizationId = orgId ?? OrgId
    };

    // GetAssignmentRecipientsAsync

    [Fact]
    public async Task GetAssignmentRecipientsAsync_returns_active_members_with_notifications_enabled_assigned_to_program_year()
    {
        var ctx = CreateContext();
        var programYearId = Guid.NewGuid();
        var member = MakeMember();
        var project = MakeProject(programYearId);
        var assignment = MakeAssignment(project.Id, member.Id);
        ctx.Members.Add(member);
        ctx.Projects.Add(project);
        ctx.ProjectAssignments.Add(assignment);
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAssignmentRecipientsAsync(programYearId, OrgId);

        Assert.Single(result);
        Assert.Equal(member.Id, result[0].MemberId);
        Assert.Equal("Alice Soprano", result[0].Name);
        Assert.Equal("alice@choir.org", result[0].Email);
    }

    [Fact]
    public async Task GetAssignmentRecipientsAsync_excludes_member_with_notifications_disabled()
    {
        var ctx = CreateContext();
        var programYearId = Guid.NewGuid();
        var optedOut = MakeMember("Bob", "Bass", "bob@choir.org", notificationsEnabled: false);
        var active = MakeMember("Alice", "Soprano", "alice@choir.org", notificationsEnabled: true);
        var project = MakeProject(programYearId);
        ctx.Members.AddRange(optedOut, active);
        ctx.Projects.Add(project);
        ctx.ProjectAssignments.AddRange(
            MakeAssignment(project.Id, optedOut.Id),
            MakeAssignment(project.Id, active.Id));
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAssignmentRecipientsAsync(programYearId, OrgId);

        Assert.Single(result);
        Assert.Equal("alice@choir.org", result[0].Email);
    }

    [Fact]
    public async Task GetAssignmentRecipientsAsync_excludes_inactive_members()
    {
        var ctx = CreateContext();
        var programYearId = Guid.NewGuid();
        var inactive = MakeMember("Bob", "Bass", "bob@choir.org", isActive: false);
        var project = MakeProject(programYearId);
        ctx.Members.Add(inactive);
        ctx.Projects.Add(project);
        ctx.ProjectAssignments.Add(MakeAssignment(project.Id, inactive.Id));
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAssignmentRecipientsAsync(programYearId, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAssignmentRecipientsAsync_deduplicates_member_assigned_to_multiple_projects()
    {
        var ctx = CreateContext();
        var programYearId = Guid.NewGuid();
        var member = MakeMember();
        var project1 = MakeProject(programYearId);
        var project2 = MakeProject(programYearId);
        ctx.Members.Add(member);
        ctx.Projects.AddRange(project1, project2);
        ctx.ProjectAssignments.AddRange(
            MakeAssignment(project1.Id, member.Id),
            MakeAssignment(project2.Id, member.Id));
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAssignmentRecipientsAsync(programYearId, OrgId);

        Assert.Single(result);
        Assert.Equal(member.Id, result[0].MemberId);
    }

    [Fact]
    public async Task GetAssignmentRecipientsAsync_returns_empty_when_no_projects_in_program_year()
    {
        var ctx = CreateContext();
        var member = MakeMember();
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAssignmentRecipientsAsync(Guid.NewGuid(), OrgId);

        Assert.Empty(result);
    }

    // SendAssignmentAnnouncementAsync

    [Fact]
    public async Task SendAssignmentAnnouncementAsync_sends_email_to_each_recipient()
    {
        var ctx = CreateContext();
        var programYearId = Guid.NewGuid();
        var member1 = MakeMember("Alice", "Soprano", "alice@choir.org");
        var member2 = MakeMember("Bob", "Bass", "bob@choir.org");
        var project = MakeProject(programYearId);
        ctx.Members.AddRange(member1, member2);
        ctx.Projects.Add(project);
        ctx.ProjectAssignments.AddRange(
            MakeAssignment(project.Id, member1.Id),
            MakeAssignment(project.Id, member2.Id));
        await ctx.SaveChangesAsync();

        var (service, provider) = CreateService(ctx);
        await service.SendAssignmentAnnouncementAsync(programYearId, "Hello", "Rehearsal details", OrgId);

        Assert.Equal(2, provider.SentMessages.Count);
        Assert.Contains(provider.SentMessages, m => m.To == "alice@choir.org");
        Assert.Contains(provider.SentMessages, m => m.To == "bob@choir.org");
        Assert.All(provider.SentMessages, m => Assert.Equal("Hello", m.Subject));
        Assert.All(provider.SentMessages, m => Assert.Equal("Rehearsal details", m.Body));
    }

    [Fact]
    public async Task SendAssignmentAnnouncementAsync_sends_no_emails_when_no_recipients()
    {
        var ctx = CreateContext();
        var (service, provider) = CreateService(ctx);

        await service.SendAssignmentAnnouncementAsync(Guid.NewGuid(), "Hello", "Body", OrgId);

        Assert.Empty(provider.SentMessages);
    }

    // GetAuditionRecipientsAsync

    [Fact]
    public async Task GetAuditionRecipientsAsync_returns_active_enabled_members_in_org()
    {
        var ctx = CreateContext();
        var auditionDate = MakeAuditionDate();
        var member1 = MakeMember("Alice", "Soprano", "alice@choir.org");
        var member2 = MakeMember("Bob", "Bass", "bob@choir.org");
        ctx.AuditionDates.Add(auditionDate);
        ctx.Members.AddRange(member1, member2);
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAuditionRecipientsAsync(auditionDate.Id, OrgId);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.Email == "alice@choir.org");
        Assert.Contains(result, r => r.Email == "bob@choir.org");
    }

    [Fact]
    public async Task GetAuditionRecipientsAsync_throws_NotFoundException_when_audition_date_not_found()
    {
        var ctx = CreateContext();
        var (service, _) = CreateService(ctx);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAuditionRecipientsAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetAuditionRecipientsAsync_excludes_member_with_notifications_disabled()
    {
        var ctx = CreateContext();
        var auditionDate = MakeAuditionDate();
        var enabledMember = MakeMember("Alice", "Soprano", "alice@choir.org", notificationsEnabled: true);
        var disabledMember = MakeMember("Bob", "Bass", "bob@choir.org", notificationsEnabled: false);
        ctx.AuditionDates.Add(auditionDate);
        ctx.Members.AddRange(enabledMember, disabledMember);
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAuditionRecipientsAsync(auditionDate.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("alice@choir.org", result[0].Email);
    }

    [Fact]
    public async Task GetAuditionRecipientsAsync_excludes_inactive_members()
    {
        var ctx = CreateContext();
        var auditionDate = MakeAuditionDate();
        var inactiveMember = MakeMember("Bob", "Bass", "bob@choir.org", isActive: false);
        ctx.AuditionDates.Add(auditionDate);
        ctx.Members.Add(inactiveMember);
        await ctx.SaveChangesAsync();

        var (service, _) = CreateService(ctx);
        var result = await service.GetAuditionRecipientsAsync(auditionDate.Id, OrgId);

        Assert.Empty(result);
    }

    // SendAuditionAnnouncementAsync

    [Fact]
    public async Task SendAuditionAnnouncementAsync_sends_email_to_each_active_enabled_member()
    {
        var ctx = CreateContext();
        var auditionDate = MakeAuditionDate();
        var member = MakeMember("Alice", "Soprano", "alice@choir.org");
        ctx.AuditionDates.Add(auditionDate);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (service, provider) = CreateService(ctx);
        await service.SendAuditionAnnouncementAsync(auditionDate.Id, "Auditions Open", "Come audition", OrgId);

        Assert.Single(provider.SentMessages);
        Assert.Equal("alice@choir.org", provider.SentMessages[0].To);
        Assert.Equal("Auditions Open", provider.SentMessages[0].Subject);
        Assert.Equal("Come audition", provider.SentMessages[0].Body);
    }

    [Fact]
    public async Task SendAuditionAnnouncementAsync_throws_NotFoundException_when_audition_date_not_found()
    {
        var ctx = CreateContext();
        var (service, _) = CreateService(ctx);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.SendAuditionAnnouncementAsync(Guid.NewGuid(), "Subject", "Body", OrgId));
    }
}

/// <summary>
/// In-memory notification provider that captures sent messages for assertion in tests.
/// </summary>
public class FakeNotificationProvider : INotificationProvider
{
    public record SentMessage(string To, string Subject, string Body);
    public List<SentMessage> SentMessages { get; } = new();

    public Task SendAsync(string to, string subject, string body)
    {
        SentMessages.Add(new SentMessage(to, subject, body));
        return Task.CompletedTask;
    }
}
