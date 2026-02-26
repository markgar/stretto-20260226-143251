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

public class ProjectsTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "ProjectsTests-" + Guid.NewGuid();

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
/// Integration tests for the Projects controller endpoints — verifies CRUD lifecycle
/// end-to-end through the full ASP.NET Core pipeline.
/// Uses the seeded program year (2025-09-01 to 2026-06-30) seeded by DataSeeder.
/// </summary>
public class ProjectsControllerTests : IClassFixture<ProjectsTestFactory>
{
    private readonly ProjectsTestFactory _factory;

    // Seeded by DataSeeder in Program.cs startup
    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";
    private static readonly string ValidStartDate = "2025-10-01";
    private static readonly string ValidEndDate = "2025-11-01";

    public ProjectsControllerTests(ProjectsTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAndGetTokenAsync(HttpClient client, string email = "admin@example.com")
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
    public async Task List_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/projects?programYearId={SeededProgramYearId}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task List_without_programYearId_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Get, "/api/projects", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/api/projects", new
        {
            programYearId = SeededProgramYearId,
            name = "Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAndGetTokenAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, "/api/projects", memberToken);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_returns_201_with_project_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/projects", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Spring Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("id", out _));
        Assert.Equal("Spring Concert", doc.RootElement.GetProperty("name").GetString());
        Assert.Equal(SeededProgramYearId, doc.RootElement.GetProperty("programYearId").GetString());
    }

    [Fact]
    public async Task Create_with_start_date_equal_to_end_date_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/projects", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Concert",
            startDate = ValidStartDate,
            endDate = ValidStartDate
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_by_id_returns_200_with_matching_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/projects", token);
        createReq.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Fall Gala",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var getReq = WithSession(HttpMethod.Get, $"/api/projects/{id}", token);
        var getResp = await client.SendAsync(getReq);

        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var body = await getResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Fall Gala", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task List_returns_200_with_created_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/projects", token);
        createReq.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Winter Showcase",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        await client.SendAsync(createReq);

        var listReq = WithSession(HttpMethod.Get, $"/api/projects?programYearId={SeededProgramYearId}", token);
        var listResp = await client.SendAsync(listReq);

        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var body = await listResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Contains(doc.RootElement.EnumerateArray(),
            p => p.GetProperty("name").GetString() == "Winter Showcase");
    }

    [Fact]
    public async Task Update_returns_200_with_updated_name()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/projects", token);
        createReq.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Old Name",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/projects/{id}", token);
        updateReq.Content = JsonContent.Create(new
        {
            name = "Spring Gala",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var updateResp = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var body = await updateResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Spring Gala", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Delete_returns_204_and_subsequent_get_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/projects", token);
        createReq.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "To Delete",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var deleteReq = WithSession(HttpMethod.Delete, $"/api/projects/{id}", token);
        var deleteResp = await client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var getReq = WithSession(HttpMethod.Get, $"/api/projects/{id}", token);
        var getResp = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    [Fact]
    public async Task Get_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/projects/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/projects/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Update_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PutAsJsonAsync($"/api/projects/{Guid.NewGuid()}", new
        {
            name = "Updated",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.DeleteAsync($"/api/projects/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Update_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAndGetTokenAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Put, $"/api/projects/{Guid.NewGuid()}", memberToken);
        req.Content = JsonContent.Create(new
        {
            name = "Updated",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_with_member_role_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAndGetTokenAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Delete, $"/api/projects/{Guid.NewGuid()}", memberToken);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_with_dates_outside_program_year_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/projects", token);
        req.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Out Of Range",
            startDate = "2024-01-01",
            endDate = "2024-02-01"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_with_invalid_dates_returns_400()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/projects", token);
        createReq.Content = JsonContent.Create(new
        {
            programYearId = SeededProgramYearId,
            name = "Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var createResp = await client.SendAsync(createReq);
        var id = JsonDocument.Parse(await createResp.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/projects/{id}", token);
        updateReq.Content = JsonContent.Create(new
        {
            name = "Concert",
            startDate = ValidEndDate,
            endDate = ValidStartDate
        });
        var updateResp = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.BadRequest, updateResp.StatusCode);
    }

    [Fact]
    public async Task Update_nonexistent_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Put, $"/api/projects/{Guid.NewGuid()}", token);
        req.Content = JsonContent.Create(new
        {
            name = "Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_nonexistent_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Delete, $"/api/projects/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
