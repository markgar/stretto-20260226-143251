using Stretto.Domain.Enums;

namespace Stretto.Application.DTOs;

public record AttendanceSummaryItemDto(Guid MemberId, string MemberName, string? Status);

public record SetAttendanceStatusRequest(AttendanceStatus Status);

public record AttendanceRecordDto(Guid Id, Guid EventId, Guid MemberId, string Status);
