using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/program-years")]
public class ProgramYearsController : ControllerBase
{
    private readonly ProgramYearService _programYears;
    private readonly IAuthService _authService;

    public ProgramYearsController(ProgramYearService programYears, IAuthService authService)
    {
        _programYears = programYears;
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
        return Ok(await _programYears.ListAsync(orgId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgramYearRequest req)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _programYears.CreateAsync(orgId, req);
        return Created($"/api/program-years/{dto.Id}", dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _programYears.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProgramYearRequest req)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _programYears.UpdateAsync(id, orgId, req);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _programYears.ArchiveAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var orgId = await GetOrgIdAsync();
        var dto = await _programYears.MarkCurrentAsync(id, orgId);
        return Ok(dto);
    }
}
