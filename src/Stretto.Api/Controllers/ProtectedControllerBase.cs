using Microsoft.AspNetCore.Mvc;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
public abstract class ProtectedControllerBase : ControllerBase
{
    private readonly IAuthService _authService;

    protected ProtectedControllerBase(IAuthService authService)
    {
        _authService = authService;
    }

    protected async Task<(Guid orgId, string role)> GetSessionAsync()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is null)
            throw new UnauthorizedException();
        var dto = await _authService.ValidateAsync(token);
        if (dto is null)
            throw new UnauthorizedException();
        return (dto.OrgId, dto.Role);
    }
}
