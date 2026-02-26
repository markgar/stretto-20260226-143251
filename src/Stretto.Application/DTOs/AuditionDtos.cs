namespace Stretto.Application.DTOs;

public record AuditionSlotDto(
    Guid Id,
    Guid AuditionDateId,
    TimeOnly SlotTime,
    Guid? MemberId,
    string Status,
    string? Notes);

public record AuditionDateDto(
    Guid Id,
    Guid ProgramYearId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int BlockLengthMinutes,
    List<AuditionSlotDto> Slots);

public record CreateAuditionDateRequest(
    Guid ProgramYearId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int BlockLengthMinutes);

public record UpdateSlotStatusRequest(string Status);

public record UpdateSlotNotesRequest(string? Notes);
