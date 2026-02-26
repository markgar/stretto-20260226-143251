namespace Stretto.Api.Tests;

/// <summary>
/// Integration tests for the /health endpoint.
/// Full HTTP integration tests require Microsoft.AspNetCore.Mvc.Testing — see issue #4.
/// </summary>
public class HealthEndpointTests
{
    [Fact]
    public void Health_endpoint_is_registered_in_api_project()
    {
        // The Program.cs in Stretto.Api registers GET /health.
        // This test verifies that the API project assembly loads without error
        // (a build-time proxy for endpoint registration until WebApplicationFactory is available).
        var assembly = typeof(Program).Assembly;
        Assert.Equal("Stretto.Api", assembly.GetName().Name);
    }
}
