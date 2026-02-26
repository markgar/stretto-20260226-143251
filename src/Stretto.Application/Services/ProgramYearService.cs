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

    public async Task<ProgramYearDto> UpdateAsync(Guid id, Guid orgId, UpdateProgramYearRequest req)
    {
        var year = await _programYears.GetByIdAsync(id, orgId);
        if (year is null)
            throw new NotFoundException("Program year not found");

        if (req.StartDate >= req.EndDate)
            throw new ValidationException(new Dictionary<string, string[]> { ["startDate"] = new[] { "Start date must be before end date" } });

        year.Name = req.Name;
        year.StartDate = req.StartDate;
        year.EndDate = req.EndDate;

        await _programYears.UpdateAsync(year);
        return ToDto(year);
    }

    public async Task<ProgramYearDto> ArchiveAsync(Guid id, Guid orgId)
    {
        var year = await _programYears.GetByIdAsync(id, orgId);
        if (year is null)
            throw new NotFoundException("Program year not found");

        year.IsArchived = true;
        year.IsCurrent = false;
        await _programYears.UpdateAsync(year);
        return ToDto(year);
    }

    public async Task<ProgramYearDto> MarkCurrentAsync(Guid id, Guid orgId)
    {
        var all = await _programYears.ListAsync(orgId);
        foreach (var py in all.Where(py => py.Id != id))
        {
            if (py.IsCurrent)
            {
                py.IsCurrent = false;
                await _programYears.UpdateAsync(py);
            }
        }

        var year = await _programYears.GetByIdAsync(id, orgId);
        if (year is null)
            throw new NotFoundException("Program year not found");

        year.IsCurrent = true;
        await _programYears.UpdateAsync(year);

        return ToDto(year);
    }

    private static ProgramYearDto ToDto(ProgramYear y) =>
        new(y.Id, y.Name, y.StartDate, y.EndDate, y.IsCurrent, y.IsArchived);
}
