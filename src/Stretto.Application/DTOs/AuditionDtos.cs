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

public record UpdateSlotStatusRequest(
    [property: System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    Stretto.Domain.Enums.AuditionStatus Status);

public record UpdateSlotNotesRequest(string? Notes);

public record AuditionSignUpRequest(string FirstName, string LastName, string Email);

public record PublicAuditionSlotDto(Guid Id, TimeOnly SlotTime, bool IsAvailable);

public record PublicAuditionDateDto(
    Guid Id,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int BlockLengthMinutes,
    List<PublicAuditionSlotDto> Slots);
