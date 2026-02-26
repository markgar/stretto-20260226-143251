using System.Collections.Concurrent;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure.Auth;

public class InMemoryAuthSessionStore : IAuthSessionStore
{
    private record SessionEntry(Guid MemberId, DateTimeOffset ExpiresAt);

    private readonly ConcurrentDictionary<string, SessionEntry> _sessions = new();
    public static readonly TimeSpan SessionLifetime = TimeSpan.FromHours(8);

    public string CreateSession(Guid memberId)
    {
        var token = Guid.NewGuid().ToString("N");
        _sessions[token] = new SessionEntry(memberId, DateTimeOffset.UtcNow.Add(SessionLifetime));
        return token;
    }

    public Guid? GetMemberId(string token)
    {
        if (!_sessions.TryGetValue(token, out var entry))
            return null;

        if (entry.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _sessions.TryRemove(token, out _);
            return null;
        }

        return entry.MemberId;
    }

    public void DeleteSession(string token)
    {
        _sessions.TryRemove(token, out _);
    }
}
