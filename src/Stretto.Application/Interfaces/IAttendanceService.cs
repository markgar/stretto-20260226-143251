using Stretto.Application.DTOs;
using Stretto.Domain.Enums;

namespace Stretto.Application.Interfaces;

public interface IAttendanceService
{
    Task<List<AttendanceSummaryItemDto>> GetForEventAsync(Guid eventId, Guid orgId);
    Task<AttendanceRecordDto> SetStatusAsync(Guid eventId, Guid memberId, Guid orgId, AttendanceStatus status);
    Task<AttendanceRecordDto> CheckInAsync(Guid eventId, Guid memberId, Guid orgId);
    Task<AttendanceRecordDto> ToggleExcusedAsync(Guid eventId, Guid memberId, Guid orgId);
}
