using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IAuditionService
{
    Task<IReadOnlyList<AuditionDateDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId);
    Task<AuditionDateDto> GetAsync(Guid id, Guid orgId);
    Task<AuditionDateDto> CreateAsync(Guid orgId, CreateAuditionDateRequest req);
    Task DeleteAsync(Guid id, Guid orgId);
    Task<AuditionSlotDto> UpdateSlotStatusAsync(Guid slotId, Guid orgId, Stretto.Domain.Enums.AuditionStatus status);
    Task<AuditionSlotDto> UpdateSlotNotesAsync(Guid slotId, Guid orgId, string? notes);
    Task<PublicAuditionDateDto> GetPublicAuditionDateAsync(Guid auditionDateId);
    Task<AuditionSlotDto> SignUpForSlotAsync(Guid slotId, AuditionSignUpRequest req);
}
