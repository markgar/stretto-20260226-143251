using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IAuthService _authService;

    public ProjectsController(IProjectService projectService, IAuthService authService)
    {
        _projectService = projectService;
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
    public async Task<IActionResult> List([FromQuery] Guid? programYearId)
    {
        var (orgId, _) = await GetSessionAsync();
        if (programYearId is null)
            return BadRequest(new { message = "programYearId query parameter is required" });
        var list = await _projectService.ListByProgramYearAsync(programYearId.Value, orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _) = await GetSessionAsync();
        var dto = await _projectService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create projects");
        var dto = await _projectService.CreateAsync(orgId, req);
        return Created($"/api/projects/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update projects");
        var dto = await _projectService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete projects");
        await _projectService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
