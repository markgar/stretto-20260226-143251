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

public class NotificationsTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "NotificationsTests-" + Guid.NewGuid();

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
/// Integration tests for NotificationsController — verifies auth enforcement,
/// role-based access control, and HTTP response shape for all four endpoints.
/// </summary>
public class NotificationsControllerTests : IClassFixture<NotificationsTestFactory>
{
    private readonly NotificationsTestFactory _factory;
    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";

    public NotificationsControllerTests(NotificationsTestFactory factory)
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

    private async Task<string> CreateAuditionDateAsync(HttpClient client, string token)
    {
        var req = WithSession(HttpMethod.Post, "/api/audition-dates", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            date = "2026-09-15",
            startTime = "10:00:00",
            endTime = "13:00:00",
            blockLengthMinutes = 30
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()!;
    }

    // GET /api/notifications/assignment-recipients — auth

    [Fact]
    public async Task GetAssignmentRecipients_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/notifications/assignment-recipients?programYearId={SeededProgramYearId}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAssignmentRecipients_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Get, $"/api/notifications/assignment-recipients?programYearId={SeededProgramYearId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAssignmentRecipients_with_admin_session_returns_200_and_json_array()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/notifications/assignment-recipients?programYearId={SeededProgramYearId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // GET /api/notifications/audition-recipients — auth

    [Fact]
    public async Task GetAuditionRecipients_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/notifications/audition-recipients?auditionDateId={Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAuditionRecipients_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Get, $"/api/notifications/audition-recipients?auditionDateId={Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAuditionRecipients_with_admin_session_and_valid_date_returns_200_and_json_array()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var auditionDateId = await CreateAuditionDateAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/notifications/audition-recipients?auditionDateId={auditionDateId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // POST /api/notifications/assignment-announcement — auth and success

    [Fact]
    public async Task SendAssignmentAnnouncement_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/api/notifications/assignment-announcement", new
        {
            programYearId = SeededProgramYearId,
            subject = "Test",
            body = "Test body"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SendAssignmentAnnouncement_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, "/api/notifications/assignment-announcement", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            subject = "Test",
            body = "Test body"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SendAssignmentAnnouncement_with_admin_and_valid_payload_returns_204()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/notifications/assignment-announcement", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            subject = "Hello members",
            body = "Rehearsal assignments are now available."
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // POST /api/notifications/audition-announcement — auth and success

    [Fact]
    public async Task SendAuditionAnnouncement_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/api/notifications/audition-announcement", new
        {
            auditionDateId = Guid.NewGuid(),
            subject = "Auditions open",
            body = "Come audition"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SendAuditionAnnouncement_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, "/api/notifications/audition-announcement", token);
        req.Content = JsonContent.Create(new
        {
            auditionDateId = Guid.NewGuid(),
            subject = "Auditions open",
            body = "Come audition"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SendAuditionAnnouncement_with_admin_and_valid_payload_returns_204()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var auditionDateId = await CreateAuditionDateAsync(client, token);

        var req = WithSession(HttpMethod.Post, "/api/notifications/audition-announcement", token);
        req.Content = JsonContent.Create(new
        {
            auditionDateId,
            subject = "Auditions are open",
            body = "Please sign up for an audition slot."
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // Recipient shape validation

    [Fact]
    public async Task GetAssignmentRecipients_response_items_have_memberId_name_email_fields()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        // Add a member with an assignment so the list is non-empty (if seeded data supports it)
        // Even an empty array is a valid response here; we just verify shape when data is present
        var req = WithSession(HttpMethod.Get, $"/api/notifications/assignment-recipients?programYearId={SeededProgramYearId}", token);
        var response = await client.SendAsync(req);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        var arr = JsonDocument.Parse(body).RootElement;
        Assert.Equal(JsonValueKind.Array, arr.ValueKind);

        foreach (var item in arr.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("memberId", out _), "Expected 'memberId' property");
            Assert.True(item.TryGetProperty("name", out _), "Expected 'name' property");
            Assert.True(item.TryGetProperty("email", out _), "Expected 'email' property");
        }
    }
}
