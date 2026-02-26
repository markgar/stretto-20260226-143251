using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/venues")]
public class VenuesController : ControllerBase
{
    private readonly IVenueService _venueService;
    private readonly IAuthService _authService;

    public VenuesController(IVenueService venueService, IAuthService authService)
    {
        _venueService = venueService;
        _authService = authService;
    }

    private async Task<(Guid orgId, string role)> GetSessionAsync()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is null)
            throw new UnauthorizedException();
        var dto = await _authService.ValidateAsync(token);
        if (dto is null)
            throw new UnauthorizedException();
        return (dto.OrgId, dto.Role);
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var (orgId, _) = await GetSessionAsync();
        var list = await _venueService.ListAsync(orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _) = await GetSessionAsync();
        var dto = await _venueService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveVenueRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create venues");
        var dto = await _venueService.CreateAsync(orgId, req);
        return Created($"/api/venues/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveVenueRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update venues");
        var dto = await _venueService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete venues");
        await _venueService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
