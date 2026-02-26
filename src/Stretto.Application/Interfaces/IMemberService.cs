using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IMemberService
{
    Task<List<MemberDto>> ListAsync(Guid orgId, string? search);
    Task<MemberDto> GetAsync(Guid id, Guid orgId);
    Task<List<MemberAssignmentSummaryDto>> GetAssignmentsAsync(Guid id, Guid orgId);
    Task<MemberDto> CreateAsync(Guid orgId, CreateMemberRequest req);
    Task<MemberDto> UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req);
    Task<MemberDto> DeactivateAsync(Guid id, Guid orgId);
    Task<MemberDto> GetMeAsync(Guid memberId, Guid orgId);
    Task<MemberDto> UpdateMeAsync(Guid memberId, Guid orgId, UpdateMemberProfileRequest req);
}
