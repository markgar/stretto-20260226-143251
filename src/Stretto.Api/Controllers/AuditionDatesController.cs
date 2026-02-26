using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/audition-dates")]
<<<<<<< HEAD
public class AuditionDatesController : ProtectedControllerBase
{
    private readonly IAuditionService _auditionService;

    public AuditionDatesController(IAuditionService auditionService, IAuthService authService)
        : base(authService)
    {
        _auditionService = auditionService;
=======
public class AuditionDatesController : ControllerBase
{
    private readonly IAuditionService _auditionService;
    private readonly IAuthService _authService;

    public AuditionDatesController(IAuditionService auditionService, IAuthService authService)
    {
        _auditionService = auditionService;
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
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? programYearId)
    {
<<<<<<< HEAD
        var (orgId, _, _) = await GetSessionAsync();
=======
        var (orgId, _) = await GetSessionAsync();
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        if (programYearId is null)
            return BadRequest(new { message = "programYearId query parameter is required" });
        var list = await _auditionService.ListByProgramYearAsync(programYearId.Value, orgId);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
<<<<<<< HEAD
        var (orgId, _, _) = await GetSessionAsync();
=======
        var (orgId, _) = await GetSessionAsync();
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        var dto = await _auditionService.GetAsync(id, orgId);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditionDateRequest req)
    {
<<<<<<< HEAD
        var (orgId, role, _) = await GetSessionAsync();
=======
        var (orgId, role) = await GetSessionAsync();
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        if (role != "Admin")
            throw new ForbiddenException("Only admins can create audition dates");
        var dto = await _auditionService.CreateAsync(orgId, req);
        return Created($"/api/audition-dates/{dto.Id}", dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
<<<<<<< HEAD
        var (orgId, role, _) = await GetSessionAsync();
=======
        var (orgId, role) = await GetSessionAsync();
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete audition dates");
        await _auditionService.DeleteAsync(id, orgId);
        return NoContent();
    }
}
