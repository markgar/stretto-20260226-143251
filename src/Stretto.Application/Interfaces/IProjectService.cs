using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IProjectService
{
    Task<List<ProjectDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId);
    Task<ProjectDto> GetAsync(Guid id, Guid orgId);
    Task<ProjectDto> CreateAsync(Guid orgId, CreateProjectRequest req);
    Task<ProjectDto> UpdateAsync(Guid id, Guid orgId, UpdateProjectRequest req);
    Task DeleteAsync(Guid id, Guid orgId);
}
