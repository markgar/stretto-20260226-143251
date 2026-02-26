using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Stretto.Infrastructure.Data;

namespace Stretto.Api.Tests;

public class AuthTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "AuthTests-" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });
    }
}

/// <summary>
/// Integration tests for /auth/login, /auth/validate, and /auth/logout using a real
/// ASP.NET Core test server with the seeded admin account (admin@example.com).
/// </summary>
public class AuthControllerTests : IClassFixture<AuthTestFactory>
{
    private readonly AuthTestFactory _factory;

    public AuthControllerTests(AuthTestFactory factory)
    {
        _factory = factory;
    }

    // Extracts the stretto_session cookie value from a Set-Cookie header.
    private static string? ExtractSessionToken(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var cookies))
            return null;

        foreach (var cookie in cookies)
        {
            if (cookie.StartsWith("stretto_session=", StringComparison.OrdinalIgnoreCase))
            {
                var value = cookie.Split(';')[0].Split('=', 2)[1];
                return value.Length > 0 ? value : null;
            }
        }

        return null;
    }

    [Fact]
    public async Task Login_with_seeded_admin_email_returns_200_with_user_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("admin@example.com", doc.RootElement.GetProperty("email").GetString());
        Assert.Equal("My Choir", doc.RootElement.GetProperty("orgName").GetString());
    }

    [Fact]
    public async Task Login_with_seeded_member_email_returns_200()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "member@example.com" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_sets_stretto_session_cookie()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var setCookieHeader = response.Headers.Contains("Set-Cookie")
            ? string.Join(";", response.Headers.GetValues("Set-Cookie"))
            : string.Empty;
        Assert.Contains("stretto_session", setCookieHeader);
    }

    [Fact]
    public async Task Login_sets_session_cookie_with_expires_not_max_age()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var setCookieValues = response.Headers.GetValues("Set-Cookie");
        Assert.Contains(setCookieValues, h =>
            h.Contains("stretto_session") &&
            h.Contains("expires=", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(setCookieValues, h =>
            h.Contains("max-age=", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Login_with_unknown_email_returns_401_with_message()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "unknown@nowhere.com" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    [Fact]
    public async Task Validate_with_valid_session_cookie_returns_200_with_user_data()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });
        var token = ExtractSessionToken(loginResponse);
        Assert.NotNull(token);

        var request = new HttpRequestMessage(HttpMethod.Get, "/auth/validate");
        request.Headers.Add("Cookie", $"stretto_session={token}");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("admin@example.com", body);
    }

    [Fact]
    public async Task Validate_without_cookie_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync("/auth/validate");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_returns_204_and_subsequent_validate_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });
        var token = ExtractSessionToken(loginResponse);
        Assert.NotNull(token);

        var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/auth/logout");
        logoutRequest.Headers.Add("Cookie", $"stretto_session={token}");
        var logoutResponse = await client.SendAsync(logoutRequest);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        var validateRequest = new HttpRequestMessage(HttpMethod.Get, "/auth/validate");
        validateRequest.Headers.Add("Cookie", $"stretto_session={token}");
        var validateResponse = await client.SendAsync(validateRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, validateResponse.StatusCode);
    }
}
