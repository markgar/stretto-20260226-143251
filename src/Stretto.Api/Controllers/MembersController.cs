using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/members")]
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;
    private readonly IAuthService _authService;

    public MembersController(IMemberService memberService, IAuthService authService)
    {
        _memberService = memberService;
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
    public async Task<IActionResult> List([FromQuery] string? search)
    {
        var (orgId, _) = await GetSessionAsync();
        return Ok(await _memberService.ListAsync(orgId, search));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (orgId, _) = await GetSessionAsync();
        return Ok(await _memberService.GetAsync(id, orgId));
    }

    [HttpGet("{id:guid}/assignments")]
    public async Task<IActionResult> GetAssignments(Guid id)
    {
        var (orgId, _) = await GetSessionAsync();
        return Ok(await _memberService.GetAssignmentsAsync(id, orgId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMemberRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create members");
        var dto = await _memberService.CreateAsync(orgId, req);
        return Created($"/api/members/{dto.Id}", dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMemberRequest req)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can update members");
        return Ok(await _memberService.UpdateAsync(id, orgId, req));
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var (orgId, role) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can deactivate members");
        return Ok(await _memberService.DeactivateAsync(id, orgId));
    }
}
