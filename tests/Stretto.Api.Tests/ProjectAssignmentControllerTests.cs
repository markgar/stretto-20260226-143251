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

public class ProjectAssignmentTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "ProjectAssignmentTests-" + Guid.NewGuid();

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
/// Integration tests for member assignment endpoints on Projects and ProgramYears controllers.
/// Covers POST/DELETE /api/projects/{id}/members and GET /api/program-years/{id}/utilization.
/// Uses seeded admin (admin@example.com) and member (member@example.com) users plus seeded
/// program year 22222222-2222-2222-2222-222222222222.
/// </summary>
public class ProjectAssignmentControllerTests : IClassFixture<ProjectAssignmentTestFactory>
{
    private readonly ProjectAssignmentTestFactory _factory;

    private static readonly string SeededProgramYearId = "22222222-2222-2222-2222-222222222222";
    private static readonly string ValidStartDate = "2025-10-01";
    private static readonly string ValidEndDate = "2025-11-01";

    public ProjectAssignmentControllerTests(ProjectAssignmentTestFactory factory)
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
            name = "Test Concert",
            startDate = ValidStartDate,
            endDate = ValidEndDate
        });
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()!;
    }

    private async Task<string> GetMemberIdAsync(HttpClient client, string token)
    {
        var req = WithSession(HttpMethod.Get, "/api/members", token);
        var resp = await client.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.EnumerateArray()
            .First(m => m.GetProperty("email").GetString() == "member@example.com")
            .GetProperty("id").GetString()!;
    }

    // GET /api/projects/{id}/members

    [Fact]
    public async Task ListMembers_returns_401_without_session()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/projects/{Guid.NewGuid()}/members");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListMembers_returns_404_for_unknown_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/projects/{Guid.NewGuid()}/members", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ListMembers_returns_200_with_all_org_members_and_IsAssigned_flags()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        // Assign one member first
        var assignReq = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        assignReq.Content = JsonContent.Create(new { memberId });
        await client.SendAsync(assignReq);

        var req = WithSession(HttpMethod.Get, $"/api/projects/{projectId}/members", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        var assigned = doc.RootElement.EnumerateArray()
            .FirstOrDefault(m => m.GetProperty("memberId").GetString() == memberId);
        Assert.True(assigned.TryGetProperty("isAssigned", out var flagProp));
        Assert.True(flagProp.GetBoolean());
    }

    // POST /api/projects/{id}/members

    [Fact]
    public async Task AssignMember_returns_401_without_session()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync(
            $"/api/projects/{Guid.NewGuid()}/members",
            new { memberId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AssignMember_returns_403_for_non_admin()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Post, $"/api/projects/{Guid.NewGuid()}/members", memberToken);
        req.Content = JsonContent.Create(new { memberId = Guid.NewGuid() });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AssignMember_returns_201_when_assignment_created()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        req.Content = JsonContent.Create(new { memberId });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task AssignMember_returns_409_when_member_already_assigned()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        var assignReq1 = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        assignReq1.Content = JsonContent.Create(new { memberId });
        await client.SendAsync(assignReq1);

        var assignReq2 = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        assignReq2.Content = JsonContent.Create(new { memberId });
        var response = await client.SendAsync(assignReq2);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task AssignMember_returns_404_for_unknown_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Post, $"/api/projects/{Guid.NewGuid()}/members", token);
        req.Content = JsonContent.Create(new { memberId = Guid.NewGuid() });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // DELETE /api/projects/{id}/members/{memberId}

    [Fact]
    public async Task UnassignMember_returns_401_without_session()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.DeleteAsync($"/api/projects/{Guid.NewGuid()}/members/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnassignMember_returns_403_for_non_admin()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var memberToken = await LoginAsync(client, "member@example.com");

        var req = WithSession(HttpMethod.Delete, $"/api/projects/{Guid.NewGuid()}/members/{Guid.NewGuid()}", memberToken);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UnassignMember_returns_204_after_assignment_removed()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        var assignReq = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        assignReq.Content = JsonContent.Create(new { memberId });
        await client.SendAsync(assignReq);

        var deleteReq = WithSession(HttpMethod.Delete, $"/api/projects/{projectId}/members/{memberId}", token);
        var response = await client.SendAsync(deleteReq);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UnassignMember_returns_404_when_assignment_does_not_exist()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        var req = WithSession(HttpMethod.Delete, $"/api/projects/{projectId}/members/{memberId}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // GET /api/program-years/{id}/utilization

    [Fact]
    public async Task Utilization_returns_401_without_session()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.GetAsync($"/api/program-years/{SeededProgramYearId}/utilization");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Utilization_returns_200_with_projects_and_members_arrays()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/program-years/{SeededProgramYearId}/utilization", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("projects", out var projects));
        Assert.True(doc.RootElement.TryGetProperty("members", out var members));
        Assert.Equal(JsonValueKind.Array, projects.ValueKind);
        Assert.Equal(JsonValueKind.Array, members.ValueKind);
    }

    [Fact]
    public async Task Utilization_returns_404_for_unknown_program_year()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/program-years/{Guid.NewGuid()}/utilization", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Utilization_reflects_assignment_after_member_is_assigned_to_project()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAsync(client);
        var projectId = await CreateProjectAsync(client, token);
        var memberId = await GetMemberIdAsync(client, token);

        var assignReq = WithSession(HttpMethod.Post, $"/api/projects/{projectId}/members", token);
        assignReq.Content = JsonContent.Create(new { memberId });
        await client.SendAsync(assignReq);

        var utilReq = WithSession(HttpMethod.Get, $"/api/program-years/{SeededProgramYearId}/utilization", token);
        var utilResp = await client.SendAsync(utilReq);

        Assert.Equal(HttpStatusCode.OK, utilResp.StatusCode);
        var body = await utilResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var memberRow = doc.RootElement.GetProperty("members").EnumerateArray()
            .FirstOrDefault(m => m.GetProperty("memberId").GetString() == memberId);
        Assert.True(memberRow.TryGetProperty("assignedCount", out var count));
        Assert.True(count.GetInt32() >= 1);
    }
}
