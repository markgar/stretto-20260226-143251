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

public class VenuesTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "VenuesTests-" + Guid.NewGuid();

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
/// Integration tests for the Venues controller endpoints — verifies full CRUD lifecycle
/// end-to-end through the full ASP.NET Core pipeline.
/// </summary>
public class VenuesControllerTests : IClassFixture<VenuesTestFactory>
{
    private readonly VenuesTestFactory _factory;

    public VenuesControllerTests(VenuesTestFactory factory)
    {
        _factory = factory;
    }

    private async Task<string> LoginAndGetTokenAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/auth/login", new { email = "mgarner22@gmail.com" });
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

        var response = await client.GetAsync("/api/venues");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task List_with_valid_session_returns_200_with_array()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var request = WithSession(HttpMethod.Get, "/api/venues", token);
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task Create_with_valid_session_returns_201_with_venue_dto()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Post, "/api/venues", token);
        req.Content = JsonContent.Create(new
        {
            name = "City Hall",
            address = "1 Main St",
            contactName = "Bob",
            contactEmail = "bob@example.com",
            contactPhone = "555-1234"
        });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("id", out _));
        Assert.Equal("City Hall", doc.RootElement.GetProperty("name").GetString());
        Assert.Equal("1 Main St", doc.RootElement.GetProperty("address").GetString());
    }

    [Fact]
    public async Task Create_without_session_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var response = await client.PostAsJsonAsync("/api/venues", new
        {
            name = "City Hall",
            address = "1 Main St"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_by_id_returns_200_with_matching_venue()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/venues", token);
        createReq.Content = JsonContent.Create(new { name = "Grand Ballroom", address = "2 Oak Ave" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var getReq = WithSession(HttpMethod.Get, $"/api/venues/{id}", token);
        var getResponse = await client.SendAsync(getReq);

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var body = await getResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Grand Ballroom", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Get_by_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Get, $"/api/venues/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    [Fact]
    public async Task Update_returns_200_with_updated_fields()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/venues", token);
        createReq.Content = JsonContent.Create(new { name = "Old Name", address = "Old Address" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var updateReq = WithSession(HttpMethod.Put, $"/api/venues/{id}", token);
        updateReq.Content = JsonContent.Create(new { name = "New Name", address = "New Address" });
        var updateResponse = await client.SendAsync(updateReq);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var body = await updateResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("New Name", doc.RootElement.GetProperty("name").GetString());
        Assert.Equal("New Address", doc.RootElement.GetProperty("address").GetString());
    }

    [Fact]
    public async Task Update_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Put, $"/api/venues/{Guid.NewGuid()}", token);
        req.Content = JsonContent.Create(new { name = "X", address = "Y" });
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_returns_204_and_subsequent_get_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/venues", token);
        createReq.Content = JsonContent.Create(new { name = "To Delete", address = "1 Delete St" });
        var createResponse = await client.SendAsync(createReq);
        var createBody = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createBody);
        var id = createDoc.RootElement.GetProperty("id").GetString();

        var deleteReq = WithSession(HttpMethod.Delete, $"/api/venues/{id}", token);
        var deleteResponse = await client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getReq = WithSession(HttpMethod.Get, $"/api/venues/{id}", token);
        var getResponse = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_unknown_id_returns_404()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var req = WithSession(HttpMethod.Delete, $"/api/venues/{Guid.NewGuid()}", token);
        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Created_venue_appears_in_list()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        var token = await LoginAndGetTokenAsync(client);

        var createReq = WithSession(HttpMethod.Post, "/api/venues", token);
        createReq.Content = JsonContent.Create(new { name = "Riverside Arena", address = "5 River Rd" });
        await client.SendAsync(createReq);

        var listReq = WithSession(HttpMethod.Get, "/api/venues", token);
        var listResponse = await client.SendAsync(listReq);
        var body = await listResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Contains(doc.RootElement.EnumerateArray(),
            v => v.GetProperty("name").GetString() == "Riverside Arena");
    }
}
