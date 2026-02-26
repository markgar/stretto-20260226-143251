using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class ProgramYearService
{
    private readonly IRepository<ProgramYear> _programYears;

    public ProgramYearService(IRepository<ProgramYear> programYears)
    {
        _programYears = programYears;
    }

    public async Task<List<ProgramYearDto>> ListAsync(Guid orgId)
    {
        var years = await _programYears.ListAsync(orgId);
        return years.OrderByDescending(y => y.StartDate).Select(ToDto).ToList();
    }

    public async Task<ProgramYearDto> GetAsync(Guid id, Guid orgId)
    {
        var year = await _programYears.GetByIdAsync(id, orgId);
        if (year is null)
            throw new NotFoundException("Program year not found");
        return ToDto(year);
    }

    public async Task<ProgramYearDto> CreateAsync(Guid orgId, CreateProgramYearRequest req)
    {
        if (req.StartDate >= req.EndDate)
            throw new ValidationException(new Dictionary<string, string[]> { ["startDate"] = new[] { "Start date must be before end date" } });

        var year = new ProgramYear
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            IsCurrent = false,
            IsArchived = false,
            OrganizationId = orgId
        };
        await _programYears.AddAsync(year);
        return ToDto(year);
    }

    private static ProgramYearDto ToDto(ProgramYear y) =>
        new(y.Id, y.Name, y.StartDate, y.EndDate, y.IsCurrent, y.IsArchived);
}
