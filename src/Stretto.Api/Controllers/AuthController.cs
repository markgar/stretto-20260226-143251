using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (dto, token) = await _authService.LoginAsync(request);
        Response.Cookies.Append("stretto_session", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromDays(30)
        });
        return Ok(dto);
    }

    [HttpGet("validate")]
    public async Task<IActionResult> Validate()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is null)
            throw new UnauthorizedException();

        var dto = await _authService.ValidateAsync(token);
        return Ok(dto);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is not null)
            await _authService.LogoutAsync(token);

        Response.Cookies.Append("stretto_session", string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        });
        return NoContent();
    }
}
