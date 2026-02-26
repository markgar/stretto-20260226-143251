using System.Collections.Concurrent;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure.Auth;

public class InMemoryAuthSessionStore : IAuthSessionStore
{
    private readonly ConcurrentDictionary<string, (Guid memberId, DateTime expiresAt)> _sessions = new();

    public string CreateSession(Guid memberId)
    {
        var token = Guid.NewGuid().ToString("N");
        _sessions[token] = (memberId, DateTime.UtcNow.AddHours(8));
        return token;
    }

    public Guid? GetMemberId(string token)
    {
        if (!_sessions.TryGetValue(token, out var entry))
            return null;

        if (DateTime.UtcNow > entry.expiresAt)
        {
            _sessions.TryRemove(token, out _);
            return null;
        }

        return entry.memberId;
    }

    public void DeleteSession(string token)
    {
        _sessions.TryRemove(token, out _);
    }
}
