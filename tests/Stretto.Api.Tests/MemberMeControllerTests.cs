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

public class MemberMeTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "MemberMeTests-" + Guid.NewGuid();

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
/// Integration tests for GET /api/members/me and PUT /api/members/me —
/// verifies member profile read and update through the full ASP.NET Core pipeline.
/// </summary>
public class MemberMeControllerTests : IClassFixture<MemberMeTestFactory>
{
    private readonly MemberMeTestFactory _factory;

    public MemberMeControllerTests(MemberMeTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/auth/login", new { email });
        response.EnsureSuccessStatusCode();
        var cookie = response.Headers.GetValues("Set-Cookie").First();
        return cookie.Split(';').First().Split('=', 2).Last();
    }

    private static HttpRequestMessage WithSession(HttpMethod method, string url, string token)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Add("Cookie", $"stretto_session={token}");
        return req;
    }

    [Fact]
    public async Task GetMe_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync("/api/members/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_with_valid_member_session_returns_200_with_profile()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Get, "/api/members/me", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body).RootElement;
        Assert.True(doc.TryGetProperty("id", out _));
        Assert.True(doc.TryGetProperty("firstName", out _));
        Assert.True(doc.TryGetProperty("lastName", out _));
        Assert.True(doc.TryGetProperty("email", out var emailProp));
        Assert.Equal("member@example.com", emailProp.GetString());
        Assert.True(doc.TryGetProperty("notificationOptOut", out _));
    }

    [Fact]
    public async Task GetMe_with_admin_session_returns_200_with_own_profile()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "admin@example.com");

        var req = WithSession(HttpMethod.Get, "/api/members/me", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body).RootElement;
        Assert.True(doc.TryGetProperty("email", out var emailProp));
        Assert.Equal("admin@example.com", emailProp.GetString());
    }

    [Fact]
    public async Task UpdateMe_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PutAsJsonAsync("/api/members/me", new
        {
            firstName = "Test",
            lastName = "User",
            email = "test@example.com",
            notificationOptOut = false
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMe_with_valid_request_returns_200_with_updated_profile()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Put, "/api/members/me", token);
        req.Content = JsonContent.Create(new
        {
            firstName = "UpdatedFirst",
            lastName = "UpdatedLast",
            email = "member@example.com",
            notificationOptOut = true
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body).RootElement;
        Assert.Equal("UpdatedFirst", doc.GetProperty("firstName").GetString());
        Assert.Equal("UpdatedLast", doc.GetProperty("lastName").GetString());
        Assert.True(doc.GetProperty("notificationOptOut").GetBoolean());
    }

    [Fact]
    public async Task UpdateMe_with_missing_required_fields_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Put, "/api/members/me", token);
        req.Content = JsonContent.Create(new { notificationOptOut = false });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
