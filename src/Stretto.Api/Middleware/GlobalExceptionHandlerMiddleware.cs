using System.Text.Json;
using Microsoft.Extensions.Logging;
using Stretto.Application.Exceptions;

namespace Stretto.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedException ex)
        {
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = ex.Message });
            await context.Response.WriteAsync(body);
        }
        catch (ForbiddenException ex)
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = ex.Message });
            await context.Response.WriteAsync(body);
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = ex.Message });
            await context.Response.WriteAsync(body);
        }
<<<<<<< HEAD
        catch (ConflictException ex)
        {
            context.Response.StatusCode = 409;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = ex.Message });
            await context.Response.WriteAsync(body);
        }
=======
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        catch (UnprocessableEntityException ex)
        {
            context.Response.StatusCode = 422;
            context.Response.ContentType = "application/json";
<<<<<<< HEAD
            var body = ex.Errors.Count > 0
                ? JsonSerializer.Serialize(new { message = ex.Message, errors = ex.Errors })
                : JsonSerializer.Serialize(new { message = ex.Message });
=======
            var body = JsonSerializer.Serialize(new { message = ex.Message });
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
            await context.Response.WriteAsync(body);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = "Validation failed", errors = ex.Errors });
            await context.Response.WriteAsync(body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { message = "An unexpected error occurred" });
            await context.Response.WriteAsync(body);
        }
    }
}
