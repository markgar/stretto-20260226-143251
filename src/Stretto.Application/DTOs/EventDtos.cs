using Stretto.Domain.Enums;

namespace Stretto.Application.DTOs;

public record EventDto(Guid Id, Guid ProjectId, EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId, string? VenueName);

public record CreateEventRequest(Guid ProjectId, EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId);

public record UpdateEventRequest(EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId);
