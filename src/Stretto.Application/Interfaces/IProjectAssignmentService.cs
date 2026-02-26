using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IProjectAssignmentService
{
    Task<List<ProjectMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId);
    Task AssignAsync(Guid projectId, Guid memberId, Guid orgId);
    Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId);
    Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId);
}
