using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class AuthService
{
    private readonly IRepository<Member> _members;
    private readonly IRepository<Organization> _orgs;
    private readonly IAuthSessionStore _sessions;

    public AuthService(IRepository<Member> members, IRepository<Organization> orgs, IAuthSessionStore sessions)
    {
        _members = members;
        _orgs = orgs;
        _sessions = sessions;
    }

    public async Task<(AuthUserDto dto, string token)> LoginAsync(LoginRequest req)
    {
        var member = await _members.FindOneAsync(m => m.Email == req.Email && m.IsActive);
        if (member is null)
            throw new UnauthorizedException("Invalid email or account is inactive");

        var org = await _orgs.FindOneAsync(o => o.Id == member.OrganizationId);
        var orgName = org?.Name ?? string.Empty;

        var token = _sessions.CreateSession(member.Id);
        var dto = new AuthUserDto(member.Id, member.Email, member.FirstName, member.LastName, member.Role.ToString(), member.OrganizationId, orgName);
        return (dto, token);
    }

    public async Task<AuthUserDto> ValidateAsync(string token)
    {
        var memberId = _sessions.GetMemberId(token);
        if (memberId is null)
            throw new UnauthorizedException();

        var member = await _members.FindOneAsync(m => m.Id == memberId);
        if (member is null)
            throw new UnauthorizedException();

        var org = await _orgs.FindOneAsync(o => o.Id == member.OrganizationId);
        var orgName = org?.Name ?? string.Empty;

        return new AuthUserDto(member.Id, member.Email, member.FirstName, member.LastName, member.Role.ToString(), member.OrganizationId, orgName);
    }

    public Task LogoutAsync(string token)
    {
        _sessions.DeleteSession(token);
        return Task.CompletedTask;
    }
}
