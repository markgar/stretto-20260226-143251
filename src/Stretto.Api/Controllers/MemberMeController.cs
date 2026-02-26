using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/members/me")]
public class MemberMeController : ProtectedControllerBase
{
    private readonly IMemberService _memberService;

    public MemberMeController(IMemberService memberService, IAuthService authService)
        : base(authService)
    {
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMe()
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _memberService.GetMeAsync(memberId, orgId));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMemberProfileRequest req)
    {
        var (orgId, _, memberId) = await GetSessionAsync();
        return Ok(await _memberService.UpdateMeAsync(memberId, orgId, req));
    }
}
