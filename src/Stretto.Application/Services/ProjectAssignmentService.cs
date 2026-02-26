using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class ProjectAssignmentService : IProjectAssignmentService
{
    private readonly IRepository<ProjectAssignment> _assignments;
    private readonly IRepository<Project> _projects;
    private readonly IRepository<Member> _members;
    private readonly IRepository<ProgramYear> _programYears;

    public ProjectAssignmentService(
        IRepository<ProjectAssignment> assignments,
        IRepository<Project> projects,
        IRepository<Member> members,
        IRepository<ProgramYear> programYears)
    {
        _assignments = assignments;
        _projects = projects;
        _members = members;
        _programYears = programYears;
    }

    public async Task<List<ProjectMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId)
    {
        var project = await _projects.GetByIdAsync(projectId, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        var allMembers = await _members.ListAsync(orgId, m => m.IsActive);
        var assignments = await _assignments.ListAsync(orgId, a => a.ProjectId == projectId);
        var assignedMemberIds = assignments.Select(a => a.MemberId).ToHashSet();

        return allMembers
            .Select(m => new ProjectMemberDto(
                m.Id,
                $"{m.FirstName} {m.LastName}",
                m.Email,
                assignedMemberIds.Contains(m.Id)))
            .ToList();
    }

    public async Task AssignAsync(Guid projectId, Guid memberId, Guid orgId)
    {
        var project = await _projects.GetByIdAsync(projectId, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        var member = await _members.GetByIdAsync(memberId, orgId);
        if (member is null)
            throw new NotFoundException("Member not found");

        var existing = await _assignments.FindOneAsync(
            a => a.ProjectId == projectId && a.MemberId == memberId && a.OrganizationId == orgId);
        if (existing is not null)
            throw new ConflictException("Member is already assigned to this project");

        var assignment = new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProjectId = projectId,
            MemberId = memberId
        };
        await _assignments.AddAsync(assignment);
    }

    public async Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)
    {
        var project = await _projects.GetByIdAsync(projectId, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        var assignment = await _assignments.FindOneAsync(
            a => a.ProjectId == projectId && a.MemberId == memberId && a.OrganizationId == orgId);
        if (assignment is null)
            throw new NotFoundException("Assignment not found");

        await _assignments.DeleteAsync(assignment);
    }

    public async Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId)
    {
        var programYear = await _programYears.GetByIdAsync(programYearId, orgId);
        if (programYear is null)
            throw new NotFoundException("Program year not found");

        var projects = await _projects.ListAsync(orgId, p => p.ProgramYearId == programYearId);
        var projectIds = projects.Select(p => p.Id).ToHashSet();

        var assignments = await _assignments.ListAsync(orgId, a => projectIds.Contains(a.ProjectId));
        var members = await _members.ListAsync(orgId, m => m.IsActive);

        var assignmentsByMember = assignments
            .GroupBy(a => a.MemberId)
            .ToDictionary(g => g.Key, g => g.Select(a => a.ProjectId).ToList());

        var rows = members
            .Select(m =>
            {
                var assignedProjectIds = assignmentsByMember.TryGetValue(m.Id, out var ids) ? ids : new List<Guid>();
                return new UtilizationRowDto(
                    m.Id,
                    $"{m.FirstName} {m.LastName}",
                    assignedProjectIds.Count,
                    projects.Count,
                    assignedProjectIds);
            })
            .OrderByDescending(r => r.AssignedCount)
            .ToList();

        var projectDtos = projects
            .Select(p => new ProjectDto(p.Id, p.Name, p.ProgramYearId, p.StartDate, p.EndDate))
            .ToList();

        return new UtilizationGridDto(projectDtos, rows);
    }
}
