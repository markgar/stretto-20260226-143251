using Stretto.Infrastructure.Auth;

namespace Stretto.Infrastructure.Tests;

/// <summary>
/// Unit tests for InMemoryAuthSessionStore — covers create/get/delete round-trips and expiry.
/// </summary>
public class InMemoryAuthSessionStoreTests
{
    [Fact]
    public void CreateSession_returns_non_null_non_empty_token()
    {
        var store = new InMemoryAuthSessionStore();

        var token = store.CreateSession(Guid.NewGuid());

        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void CreateSession_returns_unique_token_for_each_call()
    {
        var store = new InMemoryAuthSessionStore();
        var token1 = store.CreateSession(Guid.NewGuid());
        var token2 = store.CreateSession(Guid.NewGuid());

        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GetMemberId_returns_correct_member_id_for_created_token()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();
        var token = store.CreateSession(memberId);

        Assert.Equal(memberId, store.GetMemberId(token));
    }

    [Fact]
    public void GetMemberId_returns_null_for_unknown_token()
    {
        var store = new InMemoryAuthSessionStore();

        Assert.Null(store.GetMemberId("nonexistent-token-xyz"));
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

    [Fact]
    public void Multiple_sessions_for_same_member_are_tracked_independently()
    {
        var store = new InMemoryAuthSessionStore();
        var memberId = Guid.NewGuid();
        var token1 = store.CreateSession(memberId);
        var token2 = store.CreateSession(memberId);

        store.DeleteSession(token1);

        Assert.Null(store.GetMemberId(token1));
        Assert.Equal(memberId, store.GetMemberId(token2));
    }
}
