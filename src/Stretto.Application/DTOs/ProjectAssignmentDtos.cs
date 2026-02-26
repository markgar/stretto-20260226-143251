namespace Stretto.Application.DTOs;

public record ProjectMemberDto(Guid MemberId, string FullName, string Email, bool IsAssigned);

public record AssignMemberRequest(Guid MemberId);

public record UtilizationRowDto(Guid MemberId, string FullName, int AssignedCount, int TotalProjects, List<Guid> AssignedProjectIds);

public record UtilizationGridDto(List<ProjectDto> Projects, List<UtilizationRowDto> Members);
