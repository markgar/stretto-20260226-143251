using Stretto.Infrastructure.Auth;

namespace Stretto.Api.Tests;

/// <summary>
/// Tests for InMemoryAuthSessionStore — verifies session token lifecycle.
/// </summary>
public class InMemoryAuthSessionStoreTests
{
    [Fact]
    public void CreateSession_returns_non_null_non_empty_token()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();

        var token = store.CreateSession(memberId);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void CreateSession_returns_unique_token_per_call()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();

        var token1 = store.CreateSession(memberId);
        var token2 = store.CreateSession(memberId);

        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GetMemberId_returns_member_id_for_active_session()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();
        var token = store.CreateSession(memberId);

        var result = store.GetMemberId(token);

        Assert.Equal(memberId, result);
    }

    [Fact]
    public void GetMemberId_returns_null_for_unknown_token()
    {
        var store = new InMemoryAuthSessionStore();

        var result = store.GetMemberId("nonexistent-token");

        Assert.Null(result);
    }

    [Fact]
    public void DeleteSession_removes_token_so_subsequent_lookup_returns_null()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();
        var token = store.CreateSession(memberId);

        store.DeleteSession(token);

        Assert.Null(store.GetMemberId(token));
    }

    [Fact]
    public void DeleteSession_is_noop_for_unknown_token()
    {
        var store = new InMemoryAuthSessionStore();

        var exception = Record.Exception(() => store.DeleteSession("nonexistent-token"));

        Assert.Null(exception);
    }
}
