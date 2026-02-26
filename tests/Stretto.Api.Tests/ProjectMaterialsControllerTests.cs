using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Stretto.Infrastructure.Data;

namespace Stretto.Api.Tests;

public class ProjectMaterialsTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "ProjectMaterialsTests-" + Guid.NewGuid();
    private readonly string _uploadDir = Path.Combine(Path.GetTempPath(), "stretto-pm-tests-" + Guid.NewGuid());

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });

        builder.UseSetting("Storage:UploadPath", _uploadDir);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(_uploadDir))
            Directory.Delete(_uploadDir, recursive: true);
    }
}

/// <summary>
/// Integration tests for the ProjectMaterials controller — verifies link and
/// document endpoints end-to-end through the full ASP.NET Core pipeline.
/// </summary>
public class ProjectMaterialsControllerTests : IClassFixture<ProjectMaterialsTestFactory>
{
    private readonly ProjectMaterialsTestFactory _factory;
    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";

    public ProjectMaterialsControllerTests(ProjectMaterialsTestFactory factory)
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
            name = "Materials Test Project",
            startDate = "2025-10-01",
            endDate = "2025-11-30"
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()!;
    }

    // Links — GET

    [Fact]
    public async Task ListLinks_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/projects/{Guid.NewGuid()}/links");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListLinks_with_valid_session_returns_200_and_empty_array_for_new_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/projects/{projectId}/links", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var array = JsonDocument.Parse(body).RootElement;
        Assert.Equal(JsonValueKind.Array, array.ValueKind);
        Assert.Equal(0, array.GetArrayLength());
    }

    // Links — POST

    [Fact]
    public async Task AddLink_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAsync(client, "member@example.com");
        var adminToken = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, adminToken);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/links", memberToken);
        req.Content = JsonContent.Create(new { title = "Score", url = "https://score.example.com" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddLink_as_admin_returns_201_with_link_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/links", token);
        req.Content = JsonContent.Create(new { title = "Sheet Music", url = "https://music.example.com" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Sheet Music", doc.GetProperty("title").GetString());
        Assert.Equal("https://music.example.com", doc.GetProperty("url").GetString());
        Assert.Equal(projectId, doc.GetProperty("projectId").GetString());
    }

    // Links — DELETE

    [Fact]
    public async Task DeleteLink_as_admin_for_existing_link_returns_204()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var addReq = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/links", token);
        addReq.Content = JsonContent.Create(new { title = "Rehearsal Notes", url = "https://notes.example.com" });
        var addResp = await client.SendAsync(addReq);
        var addBody = await addResp.Content.ReadAsStringAsync();
        var linkId = JsonDocument.Parse(addBody).RootElement.GetProperty("id").GetString()!;

        var delReq = WithSession(HttpMethod.Delete, $"/api/projects/{projectId}/links/{linkId}", token);
        var delResp = await client.SendAsync(delReq);

        Assert.Equal(HttpStatusCode.NoContent, delResp.StatusCode);
    }

    [Fact]
    public async Task DeleteLink_for_nonexistent_link_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Delete, $"/api/projects/{projectId}/links/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Documents — GET

    [Fact]
    public async Task ListDocuments_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/projects/{Guid.NewGuid()}/documents");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListDocuments_with_valid_session_returns_200_and_empty_array_for_new_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Get, $"/api/projects/{projectId}/documents", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var array = JsonDocument.Parse(body).RootElement;
        Assert.Equal(JsonValueKind.Array, array.ValueKind);
    }

    // Documents — POST upload

    [Fact]
    public async Task UploadDocument_as_admin_returns_201_with_document_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/documents", token);
        var form = new MultipartFormDataContent();
        form.Add(new StringContent("Sheet Music"), "title");
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("pdf content")), "file", "sheet.pdf");
        req.Content = form;

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Sheet Music", doc.GetProperty("title").GetString());
        Assert.Equal("sheet.pdf", doc.GetProperty("fileName").GetString());
    }

    [Fact]
    public async Task UploadDocument_as_member_returns_403()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var adminToken = await LoginAsync(client);
        var memberToken = await LoginAsync(client, "member@example.com");
        var projectId = await CreateProjectAsync(client, adminToken);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/documents", memberToken);
        var form = new MultipartFormDataContent();
        form.Add(new StringContent("Score"), "title");
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("data")), "file", "score.pdf");
        req.Content = form;

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
