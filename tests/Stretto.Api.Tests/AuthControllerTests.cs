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
/// Integration tests for the Auth controller endpoints — verifies login, validate, and logout
/// end-to-end through the full ASP.NET Core pipeline using seeded member data.
/// </summary>
public class AuthControllerTests : IClassFixture<AuthTestFactory>
{
    private readonly AuthTestFactory _factory;

    public AuthControllerTests(AuthTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_with_valid_email_returns_200_with_user_dto()
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
    public async Task Login_with_valid_email_sets_stretto_session_cookie()
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
    public async Task Login_with_unknown_email_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/auth/login", new { email = "unknown@nowhere.com" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    [Fact]
    public async Task Validate_with_valid_session_cookie_returns_200_with_user_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var setCookie = loginResponse.Headers.GetValues("Set-Cookie").FirstOrDefault() ?? string.Empty;
        var tokenPart = setCookie.Split(';').First();
        var token = tokenPart.Split('=', 2).Last();

        var request = new HttpRequestMessage(HttpMethod.Get, "/auth/validate");
        request.Headers.Add("Cookie", $"stretto_session={token}");
        var validateResponse = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, validateResponse.StatusCode);
        var body = await validateResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("admin@example.com", doc.RootElement.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Validate_without_cookie_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync("/auth/validate");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_with_valid_cookie_returns_204()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });
        var setCookie = loginResponse.Headers.GetValues("Set-Cookie").FirstOrDefault() ?? string.Empty;
        var tokenPart = setCookie.Split(';').First();
        var token = tokenPart.Split('=', 2).Last();

        var request = new HttpRequestMessage(HttpMethod.Post, "/auth/logout");
        request.Headers.Add("Cookie", $"stretto_session={token}");
        var logoutResponse = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
    }

    [Fact]
    public async Task Logout_invalidates_session_so_validate_returns_401_after()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new { email = "member@example.com" });
        var setCookie = loginResponse.Headers.GetValues("Set-Cookie").FirstOrDefault() ?? string.Empty;
        var tokenPart = setCookie.Split(';').First();
        var token = tokenPart.Split('=', 2).Last();

        var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/auth/logout");
        logoutRequest.Headers.Add("Cookie", $"stretto_session={token}");
        await client.SendAsync(logoutRequest);

        var validateRequest = new HttpRequestMessage(HttpMethod.Get, "/auth/validate");
        validateRequest.Headers.Add("Cookie", $"stretto_session={token}");
        var validateResponse = await client.SendAsync(validateRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, validateResponse.StatusCode);
    }
}
