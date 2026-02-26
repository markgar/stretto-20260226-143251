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

public class EventsTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "EventsTests-" + Guid.NewGuid();

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
/// Integration tests for the Events controller endpoints — verifies CRUD lifecycle
/// end-to-end through the full ASP.NET Core pipeline.
/// Creates a project under the seeded program year (2025-09-01 to 2026-06-30) and
/// then tests all event operations against that project.
/// </summary>
public class EventsControllerTests : IClassFixture<EventsTestFactory>
{
    private readonly EventsTestFactory _factory;

    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";
    private static readonly string ProjectStartDate = "2025-10-01";
    private static readonly string ProjectEndDate = "2025-11-30";
    private static readonly string EventDateInRange = "2025-10-15";
    private static readonly string EventDateOutOfRange = "2025-12-01";

    public EventsControllerTests(EventsTestFactory factory)
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

    private async Task<string> CreateProjectAsync(HttpClient client, string token)
    {
        var req = WithSession(HttpMethod.Post, "/api/projects", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Events Test Project",
            startDate = ProjectStartDate,
            endDate = ProjectEndDate
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task List_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var response = await client.GetAsync($"/api/events?projectId={projectId}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task List_without_projectId_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/events", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, adminToken);
        var memberToken = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, "/api/events", memberToken);
        req.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_returns_201_with_event_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Post, "/api/events", token);
        req.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("id", out _));
        Assert.Equal(projectId, doc.RootElement.GetProperty("projectId").GetString());
        Assert.Equal(120, doc.RootElement.GetProperty("durationMinutes").GetInt32());
    }

    [Fact]
    public async Task List_returns_200_with_created_event()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var createReq = WithSession(HttpMethod.Post, "/api/events", token);
        createReq.Content = JsonContent.Create(new
        {
            projectId,
            type = 1,
            date = EventDateInRange,
            startTime = "19:00:00",
            durationMinutes = 90,
            venueId = (string?)null
        });
        await client.SendAsync(createReq);

        var listReq = WithSession(HttpMethod.Get, $"/api/events?projectId={projectId}", token);
        var listResp = await client.SendAsync(listReq);

        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var body = await listResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Contains(doc.RootElement.EnumerateArray(),
            e => e.GetProperty("projectId").GetString() == projectId);
    }

    [Fact]
    public async Task Get_by_id_returns_200_with_matching_event()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var createReq = WithSession(HttpMethod.Post, "/api/events", token);
        createReq.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var getReq = WithSession(HttpMethod.Get, $"/api/events/{id}", token);
        var getResp = await client.SendAsync(getReq);

        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var body = await getResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(id, doc.RootElement.GetProperty("id").GetString());
        Assert.Equal(0, doc.RootElement.GetProperty("type").GetInt32());
    }

    [Fact]
    public async Task Update_returns_200_with_updated_duration()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var createReq = WithSession(HttpMethod.Post, "/api/events", token);
        createReq.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/events/{id}", token);
        updateReq.Content = JsonContent.Create(new
        {
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 180,
            venueId = (string?)null
        });
        var updateResp = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var body = await updateResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(180, doc.RootElement.GetProperty("durationMinutes").GetInt32());
    }

    [Fact]
    public async Task Delete_returns_204_and_subsequent_get_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var createReq = WithSession(HttpMethod.Post, "/api/events", token);
        createReq.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateInRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var deleteReq = WithSession(HttpMethod.Delete, $"/api/events/{id}", token);
        var deleteResp = await client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var getReq = WithSession(HttpMethod.Get, $"/api/events/{id}", token);
        var getResp = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    [Fact]
    public async Task Create_with_date_outside_project_range_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Post, "/api/events", token);
        req.Content = JsonContent.Create(new
        {
            projectId,
            type = 0,
            date = EventDateOutOfRange,
            startTime = "18:30:00",
            durationMinutes = 120,
            venueId = (string?)null
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/events/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
