using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IMemberCalendarService
{
    Task<List<MemberProjectSummaryDto>> GetProjectsAsync(Guid memberId, Guid orgId);
    Task<List<CalendarEventDto>> GetUpcomingEventsAsync(Guid memberId, Guid orgId);
}
