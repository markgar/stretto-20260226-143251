using Stretto.Domain.Enums;

namespace Stretto.Application.DTOs;

public record UpcomingEventDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    EventType EventType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string? VenueName);

public record RecentActivityItem(
    string ActivityType,
    string Description,
    DateTime OccurredAt);

public record DashboardSummaryDto(
    Guid? ProgramYearId,
    string? ProgramYearName,
    List<UpcomingEventDto> UpcomingEvents,
    List<RecentActivityItem> RecentActivity);
