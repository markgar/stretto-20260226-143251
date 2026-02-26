using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IAuthService
{
    Task<(AuthUserDto dto, string token)> LoginAsync(LoginRequest req);
    Task<AuthUserDto> ValidateAsync(string token);
    Task LogoutAsync(string token);
}
