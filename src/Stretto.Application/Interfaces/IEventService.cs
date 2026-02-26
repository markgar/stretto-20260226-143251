using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IEventService
{
    Task<List<EventDto>> ListByProjectAsync(Guid projectId, Guid orgId);
    Task<EventDto> GetAsync(Guid id, Guid orgId);
    Task<EventDto> CreateAsync(Guid orgId, CreateEventRequest req);
    Task<EventDto> UpdateAsync(Guid id, Guid orgId, UpdateEventRequest req);
    Task DeleteAsync(Guid id, Guid orgId);
}
