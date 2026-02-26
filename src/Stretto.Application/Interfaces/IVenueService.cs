using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IVenueService
{
    Task<List<VenueDto>> ListAsync(Guid orgId);
    Task<VenueDto> GetAsync(Guid id, Guid orgId);
    Task<VenueDto> CreateAsync(Guid orgId, SaveVenueRequest req);
    Task<VenueDto> UpdateAsync(Guid id, Guid orgId, SaveVenueRequest req);
    Task DeleteAsync(Guid id, Guid orgId);
}
