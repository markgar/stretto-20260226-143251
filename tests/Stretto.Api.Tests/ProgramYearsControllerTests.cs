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

public class ProgramYearsTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "ProgramYearsTests-" + Guid.NewGuid();

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
/// Integration tests for the ProgramYears controller endpoints — verifies full CRUD + activate/archive lifecycle
/// end-to-end through the full ASP.NET Core pipeline.
/// </summary>
public class ProgramYearsControllerTests : IClassFixture<ProgramYearsTestFactory>
{
    private readonly ProgramYearsTestFactory _factory;

    public ProgramYearsControllerTests(ProgramYearsTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAndGetTokenAsync(HttpClient client)
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

    [Fact]
    public async Task List_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync("/api/program-years");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task List_with_valid_session_returns_200_with_array()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/program-years", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task Create_returns_201_with_id_and_correct_fields()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/program-years", token);
        req.Content = JsonContent.Create(new
        {
            name = "2025–2026",
            startDate = "2025-09-01",
            endDate = "2026-06-30"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("id", out _));
        Assert.Equal("2025–2026", doc.RootElement.GetProperty("name").GetString());
        Assert.False(doc.RootElement.GetProperty("isCurrent").GetBoolean());
        Assert.False(doc.RootElement.GetProperty("isArchived").GetBoolean());
    }

    [Fact]
    public async Task Create_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/api/program-years", new
        {
            name = "2025–2026",
            startDate = "2025-09-01",
            endDate = "2026-06-30"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_with_start_date_after_end_date_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/program-years", token);
        req.Content = JsonContent.Create(new
        {
            name = "Bad Year",
            startDate = "2026-06-30",
            endDate = "2025-09-01"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task Get_by_id_returns_200_with_matching_program_year()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "Test Year", startDate = "2024-09-01", endDate = "2025-06-30" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var getReq = WithSession(HttpMethod.Get, $"/api/program-years/{id}", token);
        var getResponse = await client.SendAsync(getReq);

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var body = await getResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Test Year", doc.RootElement.GetProperty("name").GetString());
        Assert.False(doc.RootElement.GetProperty("isCurrent").GetBoolean());
        Assert.False(doc.RootElement.GetProperty("isArchived").GetBoolean());
    }

    [Fact]
    public async Task Get_by_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/program-years/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    [Fact]
    public async Task Update_returns_200_with_updated_name()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "Old Name", startDate = "2023-09-01", endDate = "2024-06-30" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/program-years/{id}", token);
        updateReq.Content = JsonContent.Create(new { name = "New Name", startDate = "2023-09-01", endDate = "2024-06-30" });
        var updateResponse = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var body = await updateResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("New Name", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Update_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Put, $"/api/program-years/{Guid.NewGuid()}", token);
        req.Content = JsonContent.Create(new { name = "X", startDate = "2023-09-01", endDate = "2024-06-30" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Archive_returns_200_with_isArchived_true_and_isCurrent_false()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "Archive Me", startDate = "2022-09-01", endDate = "2023-06-30" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var archiveReq = WithSession(HttpMethod.Post, $"/api/program-years/{id}/archive", token);
        var archiveResponse = await client.SendAsync(archiveReq);

        Assert.Equal(HttpStatusCode.OK, archiveResponse.StatusCode);
        var body = await archiveResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.GetProperty("isArchived").GetBoolean());
        Assert.False(doc.RootElement.GetProperty("isCurrent").GetBoolean());
    }

    [Fact]
    public async Task Activate_returns_200_with_isCurrent_true()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "Activate Me", startDate = "2021-09-01", endDate = "2022-06-30" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var activateReq = WithSession(HttpMethod.Post, $"/api/program-years/{id}/activate", token);
        var activateResponse = await client.SendAsync(activateReq);

        Assert.Equal(HttpStatusCode.OK, activateResponse.StatusCode);
        var body = await activateResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.GetProperty("isCurrent").GetBoolean());
    }

    [Fact]
    public async Task Activate_second_year_deactivates_first_year()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var create1 = WithSession(HttpMethod.Post, "/api/program-years", token);
        create1.Content = JsonContent.Create(new { name = "Year One", startDate = "2020-09-01", endDate = "2021-06-30" });
        var createResp1 = await client.SendAsync(create1);
        var body1 = await createResp1.Content.ReadAsStringAsync();
        using var doc1 = JsonDocument.Parse(body1);
        var id1 = doc1.RootElement.GetProperty("id").GetString();

        var create2 = WithSession(HttpMethod.Post, "/api/program-years", token);
        create2.Content = JsonContent.Create(new { name = "Year Two", startDate = "2021-09-01", endDate = "2022-06-30" });
        var createResp2 = await client.SendAsync(create2);
        var body2 = await createResp2.Content.ReadAsStringAsync();
        using var doc2b = JsonDocument.Parse(body2);
        var id2 = doc2b.RootElement.GetProperty("id").GetString();

        var activate1 = WithSession(HttpMethod.Post, $"/api/program-years/{id1}/activate", token);
        await client.SendAsync(activate1);

        var activate2 = WithSession(HttpMethod.Post, $"/api/program-years/{id2}/activate", token);
        await client.SendAsync(activate2);

        var getReq1 = WithSession(HttpMethod.Get, $"/api/program-years/{id1}", token);
        var getResp1 = await client.SendAsync(getReq1);
        var getBody1 = await getResp1.Content.ReadAsStringAsync();
        using var getDoc1 = JsonDocument.Parse(getBody1);

        Assert.False(getDoc1.RootElement.GetProperty("isCurrent").GetBoolean());
    }

    [Fact]
    public async Task Activate_archived_year_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "Will Be Archived", startDate = "2019-09-01", endDate = "2020-06-30" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var archiveReq = WithSession(HttpMethod.Post, $"/api/program-years/{id}/archive", token);
        await client.SendAsync(archiveReq);

        var activateReq = WithSession(HttpMethod.Post, $"/api/program-years/{id}/activate", token);
        var activateResponse = await client.SendAsync(activateReq);

        Assert.Equal(HttpStatusCode.BadRequest, activateResponse.StatusCode);
    }

    [Fact]
    public async Task Archive_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, $"/api/program-years/{Guid.NewGuid()}/archive", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Created_program_year_appears_in_list()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/program-years", token);
        createReq.Content = JsonContent.Create(new { name = "List Test Year", startDate = "2018-09-01", endDate = "2019-06-30" });
        await client.SendAsync(createReq);

        var listReq = WithSession(HttpMethod.Get, "/api/program-years", token);
        var listResponse = await client.SendAsync(listReq);
        var body = await listResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Contains(doc.RootElement.EnumerateArray(),
            y => y.GetProperty("name").GetString() == "List Test Year");
    }
}
