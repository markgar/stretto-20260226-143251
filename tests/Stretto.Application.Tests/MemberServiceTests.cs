using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for MemberService — verifies list, get, create, update, deactivate, and
/// assignment business logic using real repositories backed by an in-memory database.
/// </summary>
public class MemberServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherOrgId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static MemberService CreateService(AppDbContext ctx)
    {
        var members = new BaseRepository<Member>(ctx);
        var assignments = new BaseRepository<ProjectAssignment>(ctx);
        var projects = new BaseRepository<Project>(ctx);
        return new MemberService(members, assignments, projects);
    }

    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static Member MakeMember(
        string firstName = "Jane",
        string lastName = "Doe",
        string email = "jane@example.com",
        Role role = Role.Member,
        bool isActive = true,
        Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        Email = email,
        Role = role,
        IsActive = isActive,
        OrganizationId = orgId ?? OrgId
    };

    // ListAsync

    [Fact]
    public async Task ListAsync_returns_all_members_for_org()
    {
        var ctx = CreateContext();
        ctx.Members.AddRange(MakeMember("Alice", "Soprano"), MakeMember("Bob", "Bass"));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListAsync(OrgId, null);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, m => m.FirstName == "Alice");
        Assert.Contains(result, m => m.FirstName == "Bob");
    }

    [Fact]
    public async Task ListAsync_excludes_members_from_other_orgs()
    {
        var ctx = CreateContext();
        ctx.Members.Add(MakeMember(orgId: OtherOrgId));
        ctx.Members.Add(MakeMember("Mine", "Member"));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListAsync(OrgId, null);

        Assert.Single(result);
        Assert.Equal("Mine", result[0].FirstName);
    }

    [Fact]
    public async Task ListAsync_orders_by_last_name_then_first_name()
    {
        var ctx = CreateContext();
        ctx.Members.AddRange(
            MakeMember("Charlie", "Zzz"),
            MakeMember("Bob", "Aaa"),
            MakeMember("Alice", "Aaa"));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListAsync(OrgId, null);

        Assert.Equal("Alice", result[0].FirstName);
        Assert.Equal("Aaa", result[0].LastName);
        Assert.Equal("Bob", result[1].FirstName);
        Assert.Equal("Charlie", result[2].FirstName);
    }

    [Fact]
    public async Task ListAsync_with_search_filters_by_first_name()
    {
        var ctx = CreateContext();
        ctx.Members.AddRange(MakeMember("Alice", "Smith"), MakeMember("Bob", "Jones"));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListAsync(OrgId, "ali");

        Assert.Single(result);
        Assert.Equal("Alice", result[0].FirstName);
    }

    [Fact]
    public async Task ListAsync_with_search_filters_by_email()
    {
        var ctx = CreateContext();
        ctx.Members.AddRange(
            MakeMember(email: "alice@choir.org"),
            MakeMember(email: "bob@choir.org"));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListAsync(OrgId, "alice");

        Assert.Single(result);
        Assert.Equal("alice@choir.org", result[0].Email);
    }

    // GetAsync

    [Fact]
    public async Task GetAsync_returns_member_dto_with_all_fields()
    {
        var ctx = CreateContext();
        var member = MakeMember("Jane", "Singer", "jane.singer@example.com", Role.Admin);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetAsync(member.Id, OrgId);

        Assert.Equal(member.Id, result.Id);
        Assert.Equal("Jane", result.FirstName);
        Assert.Equal("Singer", result.LastName);
        Assert.Equal("jane.singer@example.com", result.Email);
        Assert.Equal("Admin", result.Role);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_id_not_found()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).GetAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_for_member_in_different_org()
    {
        var ctx = CreateContext();
        var member = MakeMember(orgId: OtherOrgId);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).GetAsync(member.Id, OrgId));
    }

    // CreateAsync

    [Fact]
    public async Task CreateAsync_returns_dto_with_new_id_and_isActive_true()
    {
        var ctx = CreateContext();
        var req = new CreateMemberRequest("Jane", "Doe", "jane@example.com", "Member");

        var result = await CreateService(ctx).CreateAsync(OrgId, req);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Jane", result.FirstName);
        Assert.Equal("Doe", result.LastName);
        Assert.Equal("jane@example.com", result.Email);
        Assert.Equal("Member", result.Role);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_for_invalid_role()
    {
        var ctx = CreateContext();
        var req = new CreateMemberRequest("Jane", "Doe", "jane@example.com", "SuperUser");

        var ex = await Assert.ThrowsAsync<Stretto.Application.Exceptions.ValidationException>(() =>
            CreateService(ctx).CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("role"));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_for_duplicate_email()
    {
        var ctx = CreateContext();
        ctx.Members.Add(MakeMember(email: "dup@example.com"));
        await ctx.SaveChangesAsync();
        var req = new CreateMemberRequest("Jane", "Doe", "dup@example.com", "Member");

        var ex = await Assert.ThrowsAsync<Stretto.Application.Exceptions.ValidationException>(() =>
            CreateService(ctx).CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("email"));
    }

    // UpdateAsync

    [Fact]
    public async Task UpdateAsync_persists_updated_fields_and_returns_dto()
    {
        var ctx = CreateContext();
        var member = MakeMember("Jane", "Doe", "jane@example.com");
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();
        var req = new UpdateMemberRequest("Jane", "Smith", "jane.smith@example.com", "Admin", true);

        var result = await CreateService(ctx).UpdateAsync(member.Id, OrgId, req);

        Assert.Equal("Smith", result.LastName);
        Assert.Equal("jane.smith@example.com", result.Email);
        Assert.Equal("Admin", result.Role);
    }

    [Fact]
    public async Task UpdateAsync_throws_NotFoundException_when_member_not_found()
    {
        var ctx = CreateContext();
        var req = new UpdateMemberRequest("Jane", "Doe", "jane@example.com", "Member", true);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).UpdateAsync(Guid.NewGuid(), OrgId, req));
    }

    [Fact]
    public async Task UpdateAsync_throws_ValidationException_for_invalid_role()
    {
        var ctx = CreateContext();
        var member = MakeMember();
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();
        var req = new UpdateMemberRequest("Jane", "Doe", "jane@example.com", "NotARole", true);

        var ex = await Assert.ThrowsAsync<Stretto.Application.Exceptions.ValidationException>(() =>
            CreateService(ctx).UpdateAsync(member.Id, OrgId, req));

        Assert.True(ex.Errors.ContainsKey("role"));
    }

    // DeactivateAsync

    [Fact]
    public async Task DeactivateAsync_sets_isActive_false_and_returns_dto()
    {
        var ctx = CreateContext();
        var member = MakeMember(isActive: true);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).DeactivateAsync(member.Id, OrgId);

        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task DeactivateAsync_throws_NotFoundException_when_member_not_found()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).DeactivateAsync(Guid.NewGuid(), OrgId));
    }

    // GetAssignmentsAsync

    [Fact]
    public async Task GetAssignmentsAsync_returns_empty_list_when_member_has_no_assignments()
    {
        var ctx = CreateContext();
        var member = MakeMember();
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetAssignmentsAsync(member.Id, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAssignmentsAsync_returns_project_summaries_for_assigned_member()
    {
        var ctx = CreateContext();
        var member = MakeMember();
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Spring Concert",
            ProgramYearId = Guid.NewGuid(),
            StartDate = DateOnly.FromDateTime(DateTime.Today),
            EndDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(3)),
            OrganizationId = OrgId
        };
        var assignment = new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            MemberId = member.Id,
            ProjectId = project.Id,
            OrganizationId = OrgId
        };
        ctx.Members.Add(member);
        ctx.Projects.Add(project);
        ctx.ProjectAssignments.Add(assignment);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetAssignmentsAsync(member.Id, OrgId);

        Assert.Single(result);
        Assert.Equal(project.Id, result[0].ProjectId);
        Assert.Equal("Spring Concert", result[0].ProjectName);
    }

    // GetMeAsync

    [Fact]
    public async Task GetMeAsync_returns_member_dto_with_notification_opt_out_field()
    {
        var ctx = CreateContext();
        var member = MakeMember("Alice", "Soprano", "alice@choir.org");
        member.NotificationOptOut = true;
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).GetMeAsync(member.Id, OrgId);

        Assert.Equal(member.Id, result.Id);
        Assert.Equal("Alice", result.FirstName);
        Assert.Equal("alice@choir.org", result.Email);
        Assert.True(result.NotificationOptOut);
    }

    [Fact]
    public async Task GetMeAsync_throws_NotFoundException_when_member_not_found()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).GetMeAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetMeAsync_throws_NotFoundException_for_member_in_different_org()
    {
        var ctx = CreateContext();
        var member = MakeMember(orgId: OtherOrgId);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).GetMeAsync(member.Id, OrgId));
    }

    // UpdateMeAsync

    [Fact]
    public async Task UpdateMeAsync_updates_profile_fields_and_returns_dto()
    {
        var ctx = CreateContext();
        var member = MakeMember("Jane", "Doe", "jane@example.com");
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();
        var req = new UpdateMemberProfileRequest("Jane", "Smith", "jane.smith@example.com", true);

        var result = await CreateService(ctx).UpdateMeAsync(member.Id, OrgId, req);

        Assert.Equal("Smith", result.LastName);
        Assert.Equal("jane.smith@example.com", result.Email);
        Assert.True(result.NotificationOptOut);
    }

    [Fact]
    public async Task UpdateMeAsync_allows_member_to_keep_their_own_email()
    {
        var ctx = CreateContext();
        var member = MakeMember("Jane", "Doe", "jane@example.com");
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();
        var req = new UpdateMemberProfileRequest("Jane", "Doe", "jane@example.com", false);

        var result = await CreateService(ctx).UpdateMeAsync(member.Id, OrgId, req);

        Assert.Equal("jane@example.com", result.Email);
    }

    [Fact]
    public async Task UpdateMeAsync_throws_NotFoundException_when_member_not_found()
    {
        var ctx = CreateContext();
        var req = new UpdateMemberProfileRequest("Jane", "Doe", "jane@example.com", false);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateService(ctx).UpdateMeAsync(Guid.NewGuid(), OrgId, req));
    }

    [Fact]
    public async Task UpdateMeAsync_throws_ValidationException_when_email_used_by_another_member()
    {
        var ctx = CreateContext();
        var member1 = MakeMember("Jane", "Doe", "jane@example.com");
        var member2 = MakeMember("Bob", "Bass", "bob@example.com");
        ctx.Members.AddRange(member1, member2);
        await ctx.SaveChangesAsync();
        var req = new UpdateMemberProfileRequest("Jane", "Doe", "bob@example.com", false);

        var ex = await Assert.ThrowsAsync<Stretto.Application.Exceptions.ValidationException>(() =>
            CreateService(ctx).UpdateMeAsync(member1.Id, OrgId, req));

        Assert.True(ex.Errors.ContainsKey("email"));
    }

    [Fact]
    public async Task CreateAsync_sets_notification_opt_out_to_false_by_default()
    {
        var ctx = CreateContext();
        var req = new CreateMemberRequest("Jane", "Doe", "jane@example.com", "Member");

        var result = await CreateService(ctx).CreateAsync(OrgId, req);

        Assert.False(result.NotificationOptOut);
    }
}
