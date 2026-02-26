using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/public/auditions")]
public class PublicAuditionsController : ControllerBase
{
    private readonly IAuditionService _auditionService;

    public PublicAuditionsController(IAuditionService auditionService)
    {
        _auditionService = auditionService;
    }

    [HttpGet("{auditionDateId:guid}")]
    public async Task<IActionResult> GetPublicAuditionDate(Guid auditionDateId)
    {
        var dto = await _auditionService.GetPublicAuditionDateAsync(auditionDateId);
        return Ok(dto);
    }

    [HttpPost("{slotId:guid}/signup")]
    public async Task<IActionResult> SignUp(Guid slotId, [FromBody] AuditionSignUpRequest req)
    {
        var dto = await _auditionService.SignUpForSlotAsync(slotId, req);
        return Ok(dto);
    }
}
