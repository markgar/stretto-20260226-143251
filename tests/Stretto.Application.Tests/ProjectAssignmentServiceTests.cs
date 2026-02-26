using Microsoft.EntityFrameworkCore;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for ProjectAssignmentService — verifies list, assign, unassign, and utilization
/// grid behavior using real repositories backed by an in-memory database.
/// </summary>
public class ProjectAssignmentServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
    private static readonly Guid OtherOrgId = Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB");

    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("ProjectAssignmentTests-" + Guid.NewGuid())
            .Options);

    private static ProjectAssignmentService CreateService(AppDbContext ctx) =>
        new(
            new BaseRepository<ProjectAssignment>(ctx),
            new BaseRepository<Project>(ctx),
            new BaseRepository<Member>(ctx),
            new BaseRepository<ProgramYear>(ctx));

    private static Member MakeMember(string firstName = "Jane", string lastName = "Doe",
        string email = "jane@example.com", bool isActive = true, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        FirstName = firstName,
        LastName = lastName,
        Email = email,
        Role = Role.Member,
        IsActive = isActive,
        OrganizationId = orgId ?? OrgId
    };

    private static Project MakeProject(Guid programYearId, Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Spring Concert",
        ProgramYearId = programYearId,
        StartDate = new DateOnly(2025, 10, 1),
        EndDate = new DateOnly(2025, 11, 1),
        OrganizationId = orgId ?? OrgId
    };

    private static ProgramYear MakeProgramYear(Guid? orgId = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = "2025-2026",
        StartDate = new DateOnly(2025, 9, 1),
        EndDate = new DateOnly(2026, 6, 30),
        IsCurrent = true,
        IsArchived = false,
        OrganizationId = orgId ?? OrgId
    };

    // ListProjectMembersAsync

    [Fact]
    public async Task ListProjectMembersAsync_returns_all_active_org_members_with_correct_IsAssigned()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var memberA = MakeMember("Alice", "Alto", "alice@example.com");
        var memberB = MakeMember("Bob", "Bass", "bob@example.com");
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.AddRange(memberA, memberB);
        ctx.ProjectAssignments.Add(new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrgId,
            ProjectId = project.Id,
            MemberId = memberA.Id
        });
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListProjectMembersAsync(project.Id, OrgId);

        Assert.Equal(2, result.Count);
        var aliceDto = result.Single(m => m.FullName == "Alice Alto");
        var bobDto = result.Single(m => m.FullName == "Bob Bass");
        Assert.True(aliceDto.IsAssigned);
        Assert.False(bobDto.IsAssigned);
    }

    [Fact]
    public async Task ListProjectMembersAsync_excludes_inactive_members()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.AddRange(
            MakeMember("Active", "Member", "active@example.com", isActive: true),
            MakeMember("Inactive", "Member", "inactive@example.com", isActive: false));
        await ctx.SaveChangesAsync();

        var result = await CreateService(ctx).ListProjectMembersAsync(project.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("Active Member", result[0].FullName);
    }

    [Fact]
    public async Task ListProjectMembersAsync_throws_NotFoundException_for_unknown_project()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).ListProjectMembersAsync(Guid.NewGuid(), OrgId));
    }

    // AssignAsync

    [Fact]
    public async Task AssignAsync_creates_assignment_successfully()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var member = MakeMember();
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await CreateService(ctx).AssignAsync(project.Id, member.Id, OrgId);

        Assert.Single(ctx.ProjectAssignments);
        var assignment = ctx.ProjectAssignments.Single();
        Assert.Equal(project.Id, assignment.ProjectId);
        Assert.Equal(member.Id, assignment.MemberId);
        Assert.Equal(OrgId, assignment.OrganizationId);
    }

    [Fact]
    public async Task AssignAsync_throws_NotFoundException_for_unknown_project()
    {
        var ctx = CreateContext();
        var member = MakeMember();
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).AssignAsync(Guid.NewGuid(), member.Id, OrgId));
    }

    [Fact]
    public async Task AssignAsync_throws_NotFoundException_for_unknown_member()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).AssignAsync(project.Id, Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task AssignAsync_throws_ConflictException_when_member_already_assigned()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var member = MakeMember();
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.Add(member);
        ctx.ProjectAssignments.Add(new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrgId,
            ProjectId = project.Id,
            MemberId = member.Id
        });
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<ConflictException>(
            () => CreateService(ctx).AssignAsync(project.Id, member.Id, OrgId));
    }

    // UnassignAsync

    [Fact]
    public async Task UnassignAsync_removes_assignment_successfully()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var member = MakeMember();
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.Add(member);
        ctx.ProjectAssignments.Add(new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrgId,
            ProjectId = project.Id,
            MemberId = member.Id
        });
        await ctx.SaveChangesAsync();

        await CreateService(ctx).UnassignAsync(project.Id, member.Id, OrgId);

        Assert.Empty(ctx.ProjectAssignments);
    }

    [Fact]
    public async Task UnassignAsync_throws_NotFoundException_for_unknown_project()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).UnassignAsync(Guid.NewGuid(), Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task UnassignAsync_throws_NotFoundException_when_assignment_does_not_exist()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var member = MakeMember();
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).UnassignAsync(project.Id, member.Id, OrgId));
    }

    // GetUtilizationGridAsync

    [Fact]
    public async Task GetUtilizationGridAsync_returns_grid_with_all_active_members_and_projects()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project = MakeProject(py.Id);
        var memberA = MakeMember("Alice", "A", "a@example.com");
        ctx.ProgramYears.Add(py);
        ctx.Projects.Add(project);
        ctx.Members.Add(memberA);
        ctx.ProjectAssignments.Add(new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrgId,
            ProjectId = project.Id,
            MemberId = memberA.Id
        });
        await ctx.SaveChangesAsync();

        var grid = await CreateService(ctx).GetUtilizationGridAsync(py.Id, OrgId);

        Assert.Single(grid.Projects);
        Assert.Equal(project.Id, grid.Projects[0].Id);
        Assert.Single(grid.Members);
        var row = grid.Members[0];
        Assert.Equal(memberA.Id, row.MemberId);
        Assert.Equal(1, row.AssignedCount);
        Assert.Equal(1, row.TotalProjects);
        Assert.Contains(project.Id, row.AssignedProjectIds);
    }

    [Fact]
    public async Task GetUtilizationGridAsync_sorts_members_descending_by_assigned_count()
    {
        var ctx = CreateContext();
        var py = MakeProgramYear();
        var project1 = MakeProject(py.Id);
        var project2 = MakeProject(py.Id);
        var memberA = MakeMember("Alice", "A", "a@example.com");
        var memberB = MakeMember("Bob", "B", "b@example.com");
        ctx.ProgramYears.Add(py);
        ctx.Projects.AddRange(project1, project2);
        ctx.Members.AddRange(memberA, memberB);
        ctx.ProjectAssignments.AddRange(
            new ProjectAssignment { Id = Guid.NewGuid(), OrganizationId = OrgId, ProjectId = project1.Id, MemberId = memberA.Id },
            new ProjectAssignment { Id = Guid.NewGuid(), OrganizationId = OrgId, ProjectId = project2.Id, MemberId = memberA.Id });
        await ctx.SaveChangesAsync();

        var grid = await CreateService(ctx).GetUtilizationGridAsync(py.Id, OrgId);

        Assert.Equal(2, grid.Members.Count);
        Assert.Equal(memberA.Id, grid.Members[0].MemberId);
        Assert.Equal(2, grid.Members[0].AssignedCount);
        Assert.Equal(0, grid.Members[1].AssignedCount);
    }

    [Fact]
    public async Task GetUtilizationGridAsync_throws_NotFoundException_for_unknown_program_year()
    {
        var ctx = CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateService(ctx).GetUtilizationGridAsync(Guid.NewGuid(), OrgId));
    }
}
