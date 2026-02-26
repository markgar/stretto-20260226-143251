namespace Stretto.Application.DTOs;

public record VenueDto(Guid Id, string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone);

public record SaveVenueRequest(string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone);
