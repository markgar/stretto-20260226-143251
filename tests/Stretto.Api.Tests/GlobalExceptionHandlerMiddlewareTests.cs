using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Stretto.Api.Middleware;
using Stretto.Application.Exceptions;

namespace Stretto.Api.Tests;

/// <summary>
/// Tests for GlobalExceptionHandlerMiddleware — verifies that typed exceptions are
/// mapped to the correct HTTP status codes and JSON error envelopes.
/// </summary>
public class GlobalExceptionHandlerMiddlewareTests
{
    private static (DefaultHttpContext context, MemoryStream body) CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        var body = new MemoryStream();
        context.Response.Body = body;
        return (context, body);
    }

    private static async Task<string> ReadBodyAsync(MemoryStream body)
    {
        body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(body).ReadToEndAsync();
    }

    [Fact]
    public async Task NotFoundException_returns_404_with_message_body()
    {
        var (context, body) = CreateHttpContext();
        RequestDelegate next = _ => throw new NotFoundException("Member not found");
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(404, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        var json = await ReadBodyAsync(body);
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Member not found", doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task ValidationException_returns_400_with_validation_failed_and_errors()
    {
        var (context, body) = CreateHttpContext();
        var errors = new Dictionary<string, string[]>
        {
            ["email"] = ["Email is required"],
            ["firstName"] = ["First name is required"],
        };
        RequestDelegate next = _ => throw new Stretto.Application.Exceptions.ValidationException(errors);
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(400, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        var json = await ReadBodyAsync(body);
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Validation failed", doc.RootElement.GetProperty("message").GetString());
        Assert.True(doc.RootElement.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task UnhandledException_returns_500_with_generic_message()
    {
        var (context, body) = CreateHttpContext();
        RequestDelegate next = _ => throw new InvalidOperationException("Something went wrong");
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        var json = await ReadBodyAsync(body);
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("An unexpected error occurred", doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task UnauthorizedException_returns_401_with_message_body()
    {
        var (context, body) = CreateHttpContext();
        RequestDelegate next = _ => throw new UnauthorizedException("Invalid email or account is inactive");
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(401, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        var json = await ReadBodyAsync(body);
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Invalid email or account is inactive", doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task ConflictException_returns_409_with_message_body()
    {
        var (context, body) = CreateHttpContext();
        RequestDelegate next = _ => throw new ConflictException("This slot has already been claimed");
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(409, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        var json = await ReadBodyAsync(body);
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("This slot has already been claimed", doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Non_throwing_next_middleware_passes_status_through()
    {
        var (context, _) = CreateHttpContext();
        context.Response.StatusCode = 200;
        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = 201;
            return Task.CompletedTask;
        };
        var middleware = new GlobalExceptionHandlerMiddleware(next, NullLogger<GlobalExceptionHandlerMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(201, context.Response.StatusCode);
    }
}
