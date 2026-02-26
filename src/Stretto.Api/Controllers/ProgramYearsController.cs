using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/program-years")]
public class ProgramYearsController : ProtectedControllerBase
{
    private readonly IProgramYearService _programYears;
    private readonly IProjectAssignmentService _assignmentService;

    public ProgramYearsController(IProgramYearService programYears, IProjectAssignmentService assignmentService, IAuthService authService)
        : base(authService)
    {
        _programYears = programYears;
        _assignmentService = assignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var (orgId, _, _) = await GetSessionAsync();
        return Ok(await _programYears.ListAsync(orgId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgramYearRequest req)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _programYears.CreateAsync(orgId, req);
        return Created($"/api/program-years/{dto.Id}", dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _programYears.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProgramYearRequest req)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _programYears.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _programYears.ArchiveAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var dto = await _programYears.MarkCurrentAsync(id, orgId);
        return Ok(dto);
    }

    [HttpGet("{id:guid}/utilization")]
    public async Task<IActionResult> Utilization(Guid id)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var grid = await _assignmentService.GetUtilizationGridAsync(id, orgId);
        return Ok(grid);
    }
}
