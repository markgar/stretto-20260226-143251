namespace Stretto.Application.DTOs;

public record LoginRequest(string Email);

public record AuthUserDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid OrgId, string OrgName);
