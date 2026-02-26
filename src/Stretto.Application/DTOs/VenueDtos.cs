using System.ComponentModel.DataAnnotations;

namespace Stretto.Application.DTOs;

public record VenueDto(Guid Id, string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone);

public record SaveVenueRequest(
    [Required][MaxLength(200)] string Name,
    [Required][MaxLength(500)] string Address,
    [MaxLength(200)] string? ContactName,
    [EmailAddress] string? ContactEmail,
    [MaxLength(50)] string? ContactPhone);
