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

public class DashboardTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "DashboardTests-" + Guid.NewGuid();

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
/// Integration tests for GET /api/dashboard/summary — verifies auth enforcement,
/// role-based access control, response shape, program year scoping, and 404 handling
/// through the full ASP.NET Core pipeline with a seeded in-memory database.
/// </summary>
public class DashboardControllerTests : IClassFixture<DashboardTestFactory>
{
    private readonly DashboardTestFactory _factory;
    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";

    public DashboardControllerTests(DashboardTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAsync(HttpClient client, string email = "admin@example.com")
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
    public async Task GetSummary_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync("/api/dashboard/summary");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSummary_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Get, "/api/dashboard/summary", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetSummary_with_admin_returns_200_with_required_fields()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/dashboard/summary", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        Assert.True(root.TryGetProperty("programYearId", out _), "Response missing programYearId");
        Assert.True(root.TryGetProperty("programYearName", out _), "Response missing programYearName");
        Assert.True(root.TryGetProperty("upcomingEvents", out var events), "Response missing upcomingEvents");
        Assert.Equal(JsonValueKind.Array, events.ValueKind);
        Assert.True(root.TryGetProperty("recentActivity", out var activity), "Response missing recentActivity");
        Assert.Equal(JsonValueKind.Array, activity.ValueKind);
    }

    [Fact]
    public async Task GetSummary_with_admin_returns_seeded_program_year_id()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/dashboard/summary", token);
        var response = await client.SendAsync(req);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var programYearId = doc.RootElement.GetProperty("programYearId").GetString();
        Assert.Equal(SeededProgramYearId, programYearId);
    }

    [Fact]
    public async Task GetSummary_with_valid_programYearId_returns_200_with_matching_id()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/dashboard/summary?programYearId={SeededProgramYearId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(SeededProgramYearId, doc.RootElement.GetProperty("programYearId").GetString());
    }

    [Fact]
    public async Task GetSummary_with_unknown_programYearId_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var unknownId = Guid.NewGuid();

        var req = WithSession(HttpMethod.Get, $"/api/dashboard/summary?programYearId={unknownId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
