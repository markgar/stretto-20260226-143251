using System.Collections.Concurrent;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure.Auth;

public class InMemoryAuthSessionStore : IAuthSessionStore
{
    private readonly ConcurrentDictionary<string, Guid> _sessions = new();

    public string CreateSession(Guid memberId)
    {
        var token = Guid.NewGuid().ToString("N");
        _sessions[token] = memberId;
        return token;
    }

    public Guid? GetMemberId(string token)
    {
        return _sessions.TryGetValue(token, out var memberId) ? memberId : null;
    }

    public void DeleteSession(string token)
    {
        _sessions.TryRemove(token, out _);
    }
}
