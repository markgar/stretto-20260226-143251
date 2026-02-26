using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController : ProtectedControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService, IAuthService authService)
        : base(authService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? projectId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        if (projectId is null)
            return BadRequest(new { message = "projectId query parameter is required" });
        var list = await _eventService.ListByProjectAsync(projectId.Value, orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _eventService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create events");
        var dto = await _eventService.CreateAsync(orgId, req);
        return Created($"/api/events/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update events");
        var dto = await _eventService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete events");
        await _eventService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
