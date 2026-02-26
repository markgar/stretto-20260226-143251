namespace Stretto.Application.DTOs;

public record CalendarEventDto(
    Guid EventId,
    Guid ProjectId,
    string ProjectName,
    string EventType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string? VenueName);

public record MemberProjectSummaryDto(
    Guid ProjectId,
    string ProjectName,
    DateOnly StartDate,
    DateOnly EndDate,
    int UpcomingEventCount);
