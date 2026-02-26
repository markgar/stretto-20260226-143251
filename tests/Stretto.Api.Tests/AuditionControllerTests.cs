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

public class AuditionTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "AuditionTests-" + Guid.NewGuid();

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
/// Integration tests for AuditionDatesController and AuditionSlotsController —
/// verifies the full HTTP lifecycle end-to-end through the ASP.NET Core pipeline.
/// Uses the seeded program year (ID: 22222222-2222-2222-2222-222222222222).
/// </summary>
public class AuditionControllerTests : IClassFixture<AuditionTestFactory>
{
    private readonly AuditionTestFactory _factory;

    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";

    public AuditionControllerTests(AuditionTestFactory factory)
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

    private async Task<(string id, JsonElement dto)> CreateAuditionDateAsync(HttpClient client, string token)
    {
        var req = WithSession(HttpMethod.Post, "/api/audition-dates", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            date = "2026-06-01",
            startTime = "09:00:00",
            endTime = "12:00:00",
            blockLengthMinutes = 30
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        return (doc.RootElement.GetProperty("id").GetString()!, doc.RootElement.Clone());
    }

    // AuditionDates — auth / access control

    [Fact]
    public async Task List_audition_dates_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/audition-dates?programYearId={SeededProgramYearId}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_audition_date_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, "/api/audition-dates", memberToken);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            date = "2026-06-01",
            startTime = "09:00:00",
            endTime = "12:00:00",
            blockLengthMinutes = 30
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // AuditionDates — validation

    [Fact]
    public async Task List_audition_dates_without_programYearId_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/audition-dates", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // AuditionDates — CRUD lifecycle

    [Fact]
    public async Task List_audition_dates_returns_200_with_array_containing_created_date()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (id, _) = await CreateAuditionDateAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/audition-dates?programYearId={SeededProgramYearId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Contains(doc.RootElement.EnumerateArray(),
            e => e.GetProperty("id").GetString() == id);
    }

    [Fact]
    public async Task Get_audition_date_by_id_returns_200_with_correct_date_and_block_length()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (id, _) = await CreateAuditionDateAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/audition-dates/{id}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(id, doc.RootElement.GetProperty("id").GetString());
        Assert.Equal(30, doc.RootElement.GetProperty("blockLengthMinutes").GetInt32());
    }

    [Fact]
    public async Task Get_unknown_audition_date_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/audition-dates/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_audition_date_returns_204_and_subsequent_get_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (id, _) = await CreateAuditionDateAsync(client, token);

        var deleteReq = WithSession(HttpMethod.Delete, $"/api/audition-dates/{id}", token);
        var deleteResp = await client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var getReq = WithSession(HttpMethod.Get, $"/api/audition-dates/{id}", token);
        var getResp = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    [Fact]
    public async Task Delete_audition_date_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsync(client);
        var (id, _) = await CreateAuditionDateAsync(client, adminToken);
        var memberToken = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Delete, $"/api/audition-dates/{id}", memberToken);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // AuditionSlots — list

    [Fact]
    public async Task List_slots_without_auditionDateId_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/audition-slots", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task List_slots_returns_200_with_slot_array_having_correct_fields()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (dateId, _) = await CreateAuditionDateAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/audition-slots?auditionDateId={dateId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        var slots = doc.RootElement.EnumerateArray().ToList();
        Assert.NotEmpty(slots);
        var first = slots[0];
        Assert.True(first.TryGetProperty("id", out _));
        Assert.True(first.TryGetProperty("slotTime", out _));
        Assert.Equal("Pending", first.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, first.GetProperty("notes").ValueKind);
    }

    // AuditionSlots — status update

    [Fact]
    public async Task Update_slot_status_returns_200_with_updated_status()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (dateId, _) = await CreateAuditionDateAsync(client, token);

        var listReq = WithSession(HttpMethod.Get, $"/api/audition-slots?auditionDateId={dateId}", token);
        var listResp = await client.SendAsync(listReq);
        var slots = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync()).RootElement;
        var slotId = slots[0].GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/audition-slots/{slotId}/status", token);
        updateReq.Content = JsonContent.Create(new { status = "Accepted" });
        var updateResp = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var body = await updateResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Accepted", doc.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Update_slot_status_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsync(client);
        var (dateId, _) = await CreateAuditionDateAsync(client, adminToken);

        var listReq = WithSession(HttpMethod.Get, $"/api/audition-slots?auditionDateId={dateId}", adminToken);
        var listResp = await client.SendAsync(listReq);
        var slots = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync()).RootElement;
        var slotId = slots[0].GetProperty("id").GetString();

        var memberToken = await LoginAsync(client, "member@example.com");
        var req = WithSession(HttpMethod.Put, $"/api/audition-slots/{slotId}/status", memberToken);
        req.Content = JsonContent.Create(new { status = "Accepted" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // AuditionSlots — notes update

    [Fact]
    public async Task Update_slot_notes_returns_200_with_updated_notes()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var (dateId, _) = await CreateAuditionDateAsync(client, token);

        var listReq = WithSession(HttpMethod.Get, $"/api/audition-slots?auditionDateId={dateId}", token);
        var listResp = await client.SendAsync(listReq);
        var slots = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync()).RootElement;
        var slotId = slots[0].GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/audition-slots/{slotId}/notes", token);
        updateReq.Content = JsonContent.Create(new { notes = "Strong vocalist" });
        var updateResp = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var body = await updateResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Strong vocalist", doc.RootElement.GetProperty("notes").GetString());
    }

    [Fact]
    public async Task Update_slot_notes_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsync(client);
        var (dateId, _) = await CreateAuditionDateAsync(client, adminToken);

        var listReq = WithSession(HttpMethod.Get, $"/api/audition-slots?auditionDateId={dateId}", adminToken);
        var listResp = await client.SendAsync(listReq);
        var slots = JsonDocument.Parse(await listResp.Content.ReadAsStringAsync()).RootElement;
        var slotId = slots[0].GetProperty("id").GetString();

        var memberToken = await LoginAsync(client, "member@example.com");
        var req = WithSession(HttpMethod.Put, $"/api/audition-slots/{slotId}/notes", memberToken);
        req.Content = JsonContent.Create(new { notes = "Should not be allowed" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}

/// <summary>
/// Integration tests for PublicAuditionsController — verifies the public (unauthenticated)
/// sign-up and audition date listing endpoints.
/// </summary>
public class PublicAuditionsControllerTests : IClassFixture<AuditionTestFactory>
{
    private readonly AuditionTestFactory _factory;
    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";

    public PublicAuditionsControllerTests(AuditionTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/auth/login", new { email = "admin@example.com" });
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

    private async Task<(string dateId, string slotId)> CreateAuditionDateAndGetSlotAsync(HttpClient client)
    {
        var token = await LoginAsync(client);
        var req = WithSession(HttpMethod.Post, "/api/audition-dates", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            date = "2026-07-01",
            startTime = "10:00:00",
            endTime = "12:00:00",
            blockLengthMinutes = 30
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var dateId = body.RootElement.GetProperty("id").GetString()!;
        var slotId = body.RootElement.GetProperty("slots")[0].GetProperty("id").GetString()!;
        return (dateId, slotId);
    }

    [Fact]
    public async Task Get_public_audition_date_returns_200_without_authentication()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (dateId, _) = await CreateAuditionDateAndGetSlotAsync(client);

        var response = await client.GetAsync($"/api/public/auditions/{dateId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Get_public_audition_date_returns_correct_structure_with_slots()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (dateId, _) = await CreateAuditionDateAndGetSlotAsync(client);

        var response = await client.GetAsync($"/api/public/auditions/{dateId}");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(dateId, doc.RootElement.GetProperty("id").GetString());
        var slots = doc.RootElement.GetProperty("slots");
        Assert.Equal(JsonValueKind.Array, slots.ValueKind);
        Assert.NotEmpty(slots.EnumerateArray());
        var first = slots[0];
        Assert.True(first.TryGetProperty("id", out _));
        Assert.True(first.TryGetProperty("slotTime", out _));
        Assert.True(first.GetProperty("isAvailable").GetBoolean());
    }

    [Fact]
    public async Task Get_public_audition_date_returns_404_for_unknown_id()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/public/auditions/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Signup_for_slot_returns_200_with_slot_dto_containing_member_id()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (_, slotId) = await CreateAuditionDateAndGetSlotAsync(client);

        var response = await client.PostAsJsonAsync($"/api/public/auditions/{slotId}/signup",
            new { firstName = "Jane", lastName = "Doe", email = "jane.public@example.com" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(slotId, doc.RootElement.GetProperty("id").GetString());
        Assert.NotEqual(JsonValueKind.Null, doc.RootElement.GetProperty("memberId").ValueKind);
        Assert.Equal("Pending", doc.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Signup_for_slot_returns_422_when_slot_already_taken()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (_, slotId) = await CreateAuditionDateAndGetSlotAsync(client);

        await client.PostAsJsonAsync($"/api/public/auditions/{slotId}/signup",
            new { firstName = "Jane", lastName = "Doe", email = "first@example.com" });

        var response = await client.PostAsJsonAsync($"/api/public/auditions/{slotId}/signup",
            new { firstName = "Bob", lastName = "Smith", email = "second@example.com" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Signup_for_slot_returns_404_when_slot_not_found()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync($"/api/public/auditions/{Guid.NewGuid()}/signup",
            new { firstName = "Jane", lastName = "Doe", email = "jane@example.com" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Signup_for_slot_returns_400_when_email_is_empty()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (_, slotId) = await CreateAuditionDateAndGetSlotAsync(client);

        var response = await client.PostAsJsonAsync($"/api/public/auditions/{slotId}/signup",
            new { firstName = "Jane", lastName = "Doe", email = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_public_audition_date_shows_slot_as_unavailable_after_signup()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var (dateId, slotId) = await CreateAuditionDateAndGetSlotAsync(client);
        await client.PostAsJsonAsync($"/api/public/auditions/{slotId}/signup",
            new { firstName = "Jane", lastName = "Doe", email = "jane.taken@example.com" });

        var response = await client.GetAsync($"/api/public/auditions/{dateId}");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var slots = doc.RootElement.GetProperty("slots").EnumerateArray().ToList();
        var claimed = slots.First(s => s.GetProperty("id").GetString() == slotId);

        Assert.False(claimed.GetProperty("isAvailable").GetBoolean());
    }
}
