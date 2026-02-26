using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IRepository<Project> _projects;
    private readonly IRepository<ProgramYear> _programYears;

    public ProjectService(IRepository<Project> projects, IRepository<ProgramYear> programYears)
    {
        _projects = projects;
        _programYears = programYears;
    }

    public async Task<List<ProjectDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)
    {
        var projects = await _projects.ListAsync(orgId, p => p.ProgramYearId == programYearId);
        return projects.Select(ToDto).ToList();
    }

    public async Task<ProjectDto> GetAsync(Guid id, Guid orgId)
    {
        var project = await _projects.GetByIdAsync(id, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");
        return ToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(Guid orgId, CreateProjectRequest req)
    {
        var programYear = await _programYears.GetByIdAsync(req.ProgramYearId, orgId);
        if (programYear is null)
            throw new NotFoundException("Program year not found");

        ValidateDates(req.StartDate, req.EndDate, programYear);

        var project = new Project
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProgramYearId = req.ProgramYearId,
            Name = req.Name,
            StartDate = req.StartDate,
            EndDate = req.EndDate
        };
        await _projects.AddAsync(project);
        return ToDto(project);
    }

    public async Task<ProjectDto> UpdateAsync(Guid id, Guid orgId, UpdateProjectRequest req)
    {
        var project = await _projects.GetByIdAsync(id, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        var programYear = await _programYears.GetByIdAsync(project.ProgramYearId, orgId);
        if (programYear is null)
            throw new NotFoundException("Program year not found");

        ValidateDates(req.StartDate, req.EndDate, programYear);

        project.Name = req.Name;
        project.StartDate = req.StartDate;
        project.EndDate = req.EndDate;

        await _projects.UpdateAsync(project);
        return ToDto(project);
    }

    public async Task DeleteAsync(Guid id, Guid orgId)
    {
        var project = await _projects.GetByIdAsync(id, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");
        await _projects.DeleteAsync(project);
    }

    private static void ValidateDates(DateOnly startDate, DateOnly endDate, ProgramYear programYear)
    {
        if (startDate >= endDate)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["startDate"] = ["Start date must be before end date"]
            });

        if (startDate < programYear.StartDate || endDate > programYear.EndDate)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["startDate"] = ["Project dates must fall within the program year"]
            });
    }

    private static ProjectDto ToDto(Project p) =>
        new(p.Id, p.Name, p.ProgramYearId, p.StartDate, p.EndDate);
}
