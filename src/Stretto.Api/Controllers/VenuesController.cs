using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/venues")]
public class VenuesController : ProtectedControllerBase
{
    private readonly IVenueService _venueService;

    public VenuesController(IVenueService venueService, IAuthService authService)
        : base(authService)
    {
        _venueService = venueService;
    }


    [HttpGet]
    public async Task<IActionResult> List()
    {
        var (orgId, _, _) = await GetSessionAsync();
        var list = await _venueService.ListAsync(orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _venueService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveVenueRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create venues");
        var dto = await _venueService.CreateAsync(orgId, req);
        return Created($"/api/venues/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveVenueRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update venues");
        var dto = await _venueService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete venues");
        await _venueService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
