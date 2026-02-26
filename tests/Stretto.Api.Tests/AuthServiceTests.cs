using System.Linq.Expressions;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Auth;

namespace Stretto.Api.Tests;

/// <summary>
/// Unit tests for AuthService — verifies login, validate, and logout business logic.
/// </summary>
public class AuthServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static Organization CreateOrg() => new Organization
    {
        Id = OrgId,
        Name = "My Choir",
        CreatedAt = DateTime.UtcNow
    };

    private static Member CreateActiveMember(string email = "admin@example.com") => new Member
    {
        Id = Guid.NewGuid(),
        Email = email,
        FirstName = "Admin",
        LastName = "User",
        Role = Role.Admin,
        IsActive = true,
        OrganizationId = OrgId
    };

    private static Member CreateInactiveMember() => new Member
    {
        Id = Guid.NewGuid(),
        Email = "inactive@example.com",
        FirstName = "Inactive",
        LastName = "User",
        Role = Role.Member,
        IsActive = false,
        OrganizationId = OrgId
    };

    private class FakeRepository<T> : IRepository<T> where T : class
    {
        private readonly List<T> _store = new();

        public void Seed(T entity) => _store.Add(entity);

        public Task<T?> GetByIdAsync(Guid id, Guid orgId) => Task.FromResult<T?>(null);

        public Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate)
        {
            var compiled = predicate.Compile();
            return Task.FromResult(_store.FirstOrDefault(compiled));
        }

        public Task<List<T>> ListAsync(Guid orgId, Expression<Func<T, bool>>? predicate = null)
            => Task.FromResult(_store.ToList());

        public Task AddAsync(T entity) { _store.Add(entity); return Task.CompletedTask; }
        public Task UpdateAsync(T entity) => Task.CompletedTask;
        public Task DeleteAsync(T entity) { _store.Remove(entity); return Task.CompletedTask; }
    }

    private static (AuthService service, FakeRepository<Member> members, FakeRepository<Organization> orgs, InMemoryAuthSessionStore sessions) BuildService()
    {
        var members = new FakeRepository<Member>();
        var orgs = new FakeRepository<Organization>();
        var sessions = new InMemoryAuthSessionStore();
        var service = new AuthService(members, orgs, sessions);
        return (service, members, orgs, sessions);
    }

    [Fact]
    public async Task LoginAsync_returns_dto_and_token_for_valid_active_member()
    {
        var (service, members, orgs, _) = BuildService();
        var member = CreateActiveMember("admin@example.com");
        members.Seed(member);
        orgs.Seed(CreateOrg());

        var (dto, token) = await service.LoginAsync(new LoginRequest("admin@example.com"));

        Assert.NotNull(token);
        Assert.Equal(member.Id, dto.Id);
        Assert.Equal("admin@example.com", dto.Email);
        Assert.Equal("My Choir", dto.OrgName);
    }

    [Fact]
    public async Task LoginAsync_throws_UnauthorizedException_for_unknown_email()
    {
        var (service, _, _, _) = BuildService();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest("unknown@example.com")));
    }

    [Fact]
    public async Task LoginAsync_throws_UnauthorizedException_for_inactive_member()
    {
        var (service, members, _, _) = BuildService();
        members.Seed(CreateInactiveMember());

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest("inactive@example.com")));
    }

    [Fact]
    public async Task ValidateAsync_returns_dto_for_valid_session_token()
    {
        var (service, members, orgs, _) = BuildService();
        var member = CreateActiveMember();
        members.Seed(member);
        orgs.Seed(CreateOrg());
        var (_, token) = await service.LoginAsync(new LoginRequest(member.Email));

        var dto = await service.ValidateAsync(token);

        Assert.Equal(member.Id, dto.Id);
        Assert.Equal(member.Email, dto.Email);
    }

    [Fact]
    public async Task ValidateAsync_throws_UnauthorizedException_for_invalid_token()
    {
        var (service, _, _, _) = BuildService();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.ValidateAsync("invalid-token"));
    }

    [Fact]
    public async Task LogoutAsync_removes_session_so_subsequent_validate_throws()
    {
        var (service, members, orgs, _) = BuildService();
        var member = CreateActiveMember();
        members.Seed(member);
        orgs.Seed(CreateOrg());
        var (_, token) = await service.LoginAsync(new LoginRequest(member.Email));

        await service.LogoutAsync(token);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.ValidateAsync(token));
    }
}
