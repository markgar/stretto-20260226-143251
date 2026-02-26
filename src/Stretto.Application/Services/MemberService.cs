using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Application.Services;

public class MemberService : IMemberService
{
    private readonly IRepository<Member> _members;
    private readonly IRepository<ProjectAssignment> _assignments;
    private readonly IRepository<Project> _projects;

    public MemberService(
        IRepository<Member> members,
        IRepository<ProjectAssignment> assignments,
        IRepository<Project> projects)
    {
        _members = members;
        _assignments = assignments;
        _projects = projects;
    }

    public async Task<List<MemberDto>> ListAsync(Guid orgId, string? search)
    {
        var members = await _members.ListAsync(orgId);
        if (search is not null)
        {
            members = members
                .Where(m =>
                    m.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    m.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    m.Email.Contains(search, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }
        return members
            .OrderBy(m => m.LastName)
            .ThenBy(m => m.FirstName)
            .Select(ToDto)
            .ToList();
    }

    public async Task<MemberDto> GetAsync(Guid id, Guid orgId)
    {
        var member = await _members.GetByIdAsync(id, orgId);
        if (member is null)
            throw new NotFoundException("Member not found");
        return ToDto(member);
    }

    public async Task<List<MemberAssignmentSummaryDto>> GetAssignmentsAsync(Guid id, Guid orgId)
    {
        var assignments = await _assignments.ListAsync(orgId, a => a.MemberId == id);
        var result = new List<MemberAssignmentSummaryDto>();
        foreach (var assignment in assignments)
        {
            var project = await _projects.GetByIdAsync(assignment.ProjectId, orgId);
            if (project is not null)
                result.Add(new MemberAssignmentSummaryDto(project.Id, project.Name));
        }
        return result;
    }

    public async Task<MemberDto> CreateAsync(Guid orgId, CreateMemberRequest req)
    {
        if (!Enum.TryParse<Role>(req.Role, out var role))
            throw new ValidationException(new Dictionary<string, string[]> { ["role"] = new[] { "Invalid role" } });

        var existing = await _members.FindOneAsync(m => m.OrganizationId == orgId && m.Email == req.Email);
        if (existing is not null)
            throw new ValidationException(new Dictionary<string, string[]> { ["email"] = new[] { "Email already in use" } });

        var member = new Member
        {
            Id = Guid.NewGuid(),
            FirstName = req.FirstName,
            LastName = req.LastName,
            Email = req.Email,
            Role = role,
            IsActive = true,
            OrganizationId = orgId
        };
        await _members.AddAsync(member);
        return ToDto(member);
    }

    public async Task<MemberDto> UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req)
    {
        var member = await _members.GetByIdAsync(id, orgId);
        if (member is null)
            throw new NotFoundException("Member not found");

        if (!Enum.TryParse<Role>(req.Role, out var role))
            throw new ValidationException(new Dictionary<string, string[]> { ["role"] = new[] { "Invalid role" } });

        member.FirstName = req.FirstName;
        member.LastName = req.LastName;
        member.Email = req.Email;
        member.Role = role;
        member.IsActive = req.IsActive;

        await _members.UpdateAsync(member);
        return ToDto(member);
    }

    public async Task<MemberDto> DeactivateAsync(Guid id, Guid orgId)
    {
        var member = await _members.GetByIdAsync(id, orgId);
        if (member is null)
            throw new NotFoundException("Member not found");

        member.IsActive = false;
        await _members.UpdateAsync(member);
        return ToDto(member);
    }

    private static MemberDto ToDto(Member m) =>
        new(m.Id, m.FirstName, m.LastName, m.Email, m.Role.ToString(), m.IsActive);
}
