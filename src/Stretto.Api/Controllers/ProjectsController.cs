using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ProtectedControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IProjectAssignmentService _assignmentService;

    public ProjectsController(IProjectService projectService, IProjectAssignmentService assignmentService, IAuthService authService)
        : base(authService)
    {
        _projectService = projectService;
        _assignmentService = assignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? programYearId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        if (programYearId is null)
            return BadRequest(new { message = "programYearId query parameter is required" });
        var list = await _projectService.ListByProgramYearAsync(programYearId.Value, orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _projectService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create projects");
        var dto = await _projectService.CreateAsync(orgId, req);
        return Created($"/api/projects/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update projects");
        var dto = await _projectService.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete projects");
        await _projectService.DeleteAsync(id, orgId);
        return NoContent();
    }

    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> ListMembers(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var members = await _assignmentService.ListProjectMembersAsync(id, orgId);
        return Ok(members);
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AssignMember(Guid id, [FromBody] AssignMemberRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can assign members");
        await _assignmentService.AssignAsync(id, req.MemberId, orgId);
        return Created(string.Empty, null);
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> UnassignMember(Guid id, Guid memberId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can unassign members");
        await _assignmentService.UnassignAsync(id, memberId, orgId);
        return NoContent();
    }
}
