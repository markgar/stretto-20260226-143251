using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/venues")]
public class VenuesController : ControllerBase
{
    private readonly VenueService _venueService;
    private readonly AuthService _authService;

    public VenuesController(VenueService venueService, AuthService authService)
    {
        _venueService = venueService;
        _authService = authService;
    }

    private async Task<Guid> GetOrgIdAsync()
    {
        var token = Request.Cookies["stretto_session"];
        if (token is null)
            throw new UnauthorizedException();
        var dto = await _authService.ValidateAsync(token);
        return dto.OrgId;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var orgId = await GetOrgIdAsync();
        var list = await _venueService.ListAsync(orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _venueService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveVenueRequest req)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _venueService.CreateAsync(orgId, req);
        return Created($"/api/venues/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveVenueRequest req)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _venueService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var orgId = await GetOrgIdAsync();
        await _venueService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
