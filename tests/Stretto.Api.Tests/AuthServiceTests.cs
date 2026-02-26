using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Auth;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Api.Tests;

/// <summary>
/// Unit tests for AuthService — covers login, validate, and logout business logic using real
/// repositories backed by an in-memory database and a real InMemoryAuthSessionStore.
/// </summary>
public class AuthServiceTests
{
    private static (AuthService service, AppDbContext ctx) CreateService()
    {
        var ctx = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        var memberRepo = new BaseRepository<Member>(ctx);
        var orgRepo = new BaseRepository<Organization>(ctx);
        var sessions = new InMemoryAuthSessionStore();
        return (new AuthService(memberRepo, orgRepo, sessions), ctx);
    }

    private static Organization CreateOrg(string name = "Test Choir") => new Organization
    {
        Id = Guid.NewGuid(),
        Name = name,
        CreatedAt = DateTime.UtcNow
    };

    private static Member CreateActiveMember(Guid orgId, string email, Role role = Role.Member) => new Member
    {
        Id = Guid.NewGuid(),
        Email = email,
        FirstName = "Jane",
        LastName = "Singer",
        Role = role,
        IsActive = true,
        OrganizationId = orgId
    };

    [Fact]
    public async Task LoginAsync_with_valid_active_member_returns_dto_with_correct_fields()
    {
        var (service, ctx) = CreateService();
        var org = CreateOrg("Harmony Choir");
        var member = CreateActiveMember(org.Id, "jane.singer@example.com", Role.Admin);
        ctx.Organizations.Add(org);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (dto, token) = await service.LoginAsync(new LoginRequest("jane.singer@example.com"));

        Assert.Equal("jane.singer@example.com", dto.Email);
        Assert.Equal(org.Id, dto.OrgId);
        Assert.Equal("Harmony Choir", dto.OrgName);
        Assert.Equal("Admin", dto.Role);
        Assert.False(string.IsNullOrEmpty(token));
    }

    [Fact]
    public async Task LoginAsync_with_unknown_email_throws_UnauthorizedException()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(
            () => service.LoginAsync(new LoginRequest("nobody@example.com")));
    }

    [Fact]
    public async Task LoginAsync_with_inactive_member_throws_UnauthorizedException()
    {
        var (service, ctx) = CreateService();
        var org = CreateOrg();
        var member = CreateActiveMember(org.Id, "inactive.singer@example.com");
        member.IsActive = false;
        ctx.Organizations.Add(org);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(
            () => service.LoginAsync(new LoginRequest("inactive.singer@example.com")));
    }

    [Fact]
    public async Task ValidateAsync_with_valid_token_returns_correct_dto()
    {
        var (service, ctx) = CreateService();
        var org = CreateOrg();
        var member = CreateActiveMember(org.Id, "active.member@example.com");
        ctx.Organizations.Add(org);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (_, token) = await service.LoginAsync(new LoginRequest("active.member@example.com"));
        var dto = await service.ValidateAsync(token);

        Assert.Equal("active.member@example.com", dto.Email);
        Assert.Equal(org.Id, dto.OrgId);
    }

    [Fact]
    public async Task ValidateAsync_with_unknown_token_throws_UnauthorizedException()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(
            () => service.ValidateAsync("token-that-does-not-exist"));
    }

    [Fact]
    public async Task ValidateAsync_after_member_is_deactivated_throws_UnauthorizedException()
    {
        var (service, ctx) = CreateService();
        var org = CreateOrg();
        var member = CreateActiveMember(org.Id, "tobedeactivated@example.com");
        ctx.Organizations.Add(org);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (_, token) = await service.LoginAsync(new LoginRequest("tobedeactivated@example.com"));

        member.IsActive = false;
        ctx.Members.Update(member);
        await ctx.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(() => service.ValidateAsync(token));
    }

    [Fact]
    public async Task LogoutAsync_invalidates_session_so_subsequent_validate_throws()
    {
        var (service, ctx) = CreateService();
        var org = CreateOrg();
        var member = CreateActiveMember(org.Id, "logout.test@example.com");
        ctx.Organizations.Add(org);
        ctx.Members.Add(member);
        await ctx.SaveChangesAsync();

        var (_, token) = await service.LoginAsync(new LoginRequest("logout.test@example.com"));
        await service.LogoutAsync(token);

        await Assert.ThrowsAsync<UnauthorizedException>(() => service.ValidateAsync(token));
    }
}
