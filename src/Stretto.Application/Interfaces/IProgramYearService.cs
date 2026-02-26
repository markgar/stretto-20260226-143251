using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IProgramYearService
{
    Task<List<ProgramYearDto>> ListAsync(Guid orgId);
    Task<ProgramYearDto> GetAsync(Guid id, Guid orgId);
    Task<ProgramYearDto> CreateAsync(Guid orgId, CreateProgramYearRequest req);
    Task<ProgramYearDto> UpdateAsync(Guid id, Guid orgId, UpdateProgramYearRequest req);
    Task<ProgramYearDto> ArchiveAsync(Guid id, Guid orgId);
    Task<ProgramYearDto> MarkCurrentAsync(Guid id, Guid orgId);
}
