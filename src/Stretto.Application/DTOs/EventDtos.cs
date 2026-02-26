using System.ComponentModel.DataAnnotations;
using Stretto.Domain.Enums;

namespace Stretto.Application.DTOs;

public record EventDto(Guid Id, Guid ProjectId, EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId, string? VenueName);

public record CreateEventRequest(
    [Required] Guid ProjectId,
    [Required] EventType Type,
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime,
    [Required] int DurationMinutes,
    Guid? VenueId);

public record UpdateEventRequest(
    [Required] EventType Type,
    [Required] DateOnly Date,
    [Required] TimeOnly StartTime,
    [Required] int DurationMinutes,
    Guid? VenueId);
