using Microsoft.EntityFrameworkCore;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Api.Tests;

/// <summary>
/// Integration tests for BaseRepository and DataSeeder using an isolated in-memory database.
/// </summary>
public class InfrastructureTests
{
    private static AppDbContext CreateContext() =>
        new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);

    private static Member CreateMember(Guid orgId, string email = "test@example.com") =>
        new Member
        {
            Id = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            Email = email,
            Role = Role.Member,
            IsActive = true,
            OrganizationId = orgId,
        };

    // ── BaseRepository: multi-tenant isolation ──

    [Fact]
    public async Task ListAsync_returns_only_entities_belonging_to_given_orgId()
    {
        using var ctx = CreateContext();
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();
        ctx.Members.AddRange(CreateMember(orgA, "a@example.com"), CreateMember(orgB, "b@example.com"));
        await ctx.SaveChangesAsync();

        var repo = new BaseRepository<Member>(ctx);
        var results = await repo.ListAsync(orgA);

        Assert.Single(results);
        Assert.Equal("a@example.com", results[0].Email);
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_when_orgId_does_not_match()
    {
        using var ctx = CreateContext();
        var orgA = Guid.NewGuid();
        var member = CreateMember(orgA);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var repo = new BaseRepository<Member>(ctx);
        var result = await repo.GetByIdAsync(member.Id, Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_for_nonexistent_id()
    {
        using var ctx = CreateContext();
        var repo = new BaseRepository<Member>(ctx);

        var result = await repo.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_returns_entity_when_id_and_orgId_match()
    {
        using var ctx = CreateContext();
        var orgId = Guid.NewGuid();
        var member = CreateMember(orgId, "match@example.com");
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var repo = new BaseRepository<Member>(ctx);
        var result = await repo.GetByIdAsync(member.Id, orgId);

        Assert.NotNull(result);
        Assert.Equal("match@example.com", result!.Email);
    }

    [Fact]
    public async Task AddAsync_persists_entity_to_database()
    {
        using var ctx = CreateContext();
        var orgId = Guid.NewGuid();
        var member = CreateMember(orgId, "new@example.com");
        var repo = new BaseRepository<Member>(ctx);

        await repo.AddAsync(member);

        Assert.Equal(1, await ctx.Members.CountAsync());
    }

    [Fact]
    public async Task UpdateAsync_saves_modified_entity()
    {
        using var ctx = CreateContext();
        var orgId = Guid.NewGuid();
        var member = CreateMember(orgId, "original@example.com");
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        member.Email = "updated@example.com";
        var repo = new BaseRepository<Member>(ctx);
        await repo.UpdateAsync(member);

        var stored = await ctx.Members.FindAsync(member.Id);
        Assert.Equal("updated@example.com", stored!.Email);
    }

    [Fact]
    public async Task DeleteAsync_removes_entity_from_database()
    {
        using var ctx = CreateContext();
        var orgId = Guid.NewGuid();
        var member = CreateMember(orgId);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var repo = new BaseRepository<Member>(ctx);
        await repo.DeleteAsync(member);

        Assert.Equal(0, await ctx.Members.CountAsync());
    }

    // ── DataSeeder ──

    [Fact]
    public async Task DataSeeder_creates_organization_and_two_members_when_database_is_empty()
    {
        using var ctx = CreateContext();

        await DataSeeder.SeedAsync(ctx);

        Assert.Equal(1, await ctx.Organizations.CountAsync());
        Assert.Equal(2, await ctx.Members.CountAsync());
        var org = await ctx.Organizations.FirstAsync();
        Assert.Equal("My Choir", org.Name);
    }

    [Fact]
    public async Task DataSeeder_is_idempotent_and_does_not_duplicate_on_second_call()
    {
        using var ctx = CreateContext();

        await DataSeeder.SeedAsync(ctx);
        await DataSeeder.SeedAsync(ctx);

        Assert.Equal(1, await ctx.Organizations.CountAsync());
        Assert.Equal(2, await ctx.Members.CountAsync());
    }

    [Fact]
    public async Task DataSeeder_seeds_admin_and_member_with_correct_roles()
    {
        using var ctx = CreateContext();

        await DataSeeder.SeedAsync(ctx);

        var members = await ctx.Members.ToListAsync();
        Assert.Contains(members, m => m.Role == Role.Admin);
        Assert.Contains(members, m => m.Role == Role.Member);
    }

    // ── AppDbContext: all 12 DbSets present ──

    [Fact]
    public void AppDbContext_exposes_all_twelve_entity_dbsets()
    {
        using var ctx = CreateContext();

        Assert.NotNull(ctx.Organizations);
        Assert.NotNull(ctx.Members);
        Assert.NotNull(ctx.ProgramYears);
        Assert.NotNull(ctx.Venues);
        Assert.NotNull(ctx.Projects);
        Assert.NotNull(ctx.Events);
        Assert.NotNull(ctx.ProjectAssignments);
        Assert.NotNull(ctx.AttendanceRecords);
        Assert.NotNull(ctx.AuditionDates);
        Assert.NotNull(ctx.AuditionSlots);
        Assert.NotNull(ctx.ProjectLinks);
        Assert.NotNull(ctx.ProjectDocuments);
    }
}
