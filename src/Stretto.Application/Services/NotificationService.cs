using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationProvider _provider;
    private readonly IRepository<Member> _members;
    private readonly IRepository<ProjectAssignment> _assignments;
    private readonly IRepository<Project> _projects;
    private readonly IRepository<AuditionDate> _auditionDates;

    public NotificationService(
        INotificationProvider provider,
        IRepository<Member> members,
        IRepository<ProjectAssignment> assignments,
        IRepository<Project> projects,
        IRepository<AuditionDate> auditionDates)
    {
        _provider = provider;
        _members = members;
        _assignments = assignments;
        _projects = projects;
        _auditionDates = auditionDates;
    }

    public async Task<List<RecipientDto>> GetAssignmentRecipientsAsync(Guid programYearId, Guid orgId)
    {
        var projects = await _projects.ListAsync(orgId, p => p.ProgramYearId == programYearId);
        var projectIds = projects.Select(p => p.Id).ToHashSet();

        var allAssignments = await _assignments.ListAsync(orgId);
        var memberIds = allAssignments
            .Where(a => projectIds.Contains(a.ProjectId))
            .Select(a => a.MemberId)
            .ToHashSet();

        var members = await _members.ListAsync(orgId, m => m.IsActive && m.NotificationsEnabled);
        return members
            .Where(m => memberIds.Contains(m.Id))
            .Select(m => new RecipientDto(m.Id, $"{m.FirstName} {m.LastName}", m.Email))
            .ToList();
    }

    public async Task SendAssignmentAnnouncementAsync(Guid programYearId, string subject, string body, Guid orgId)
    {
        var recipients = await GetAssignmentRecipientsAsync(programYearId, orgId);
        foreach (var r in recipients)
            await _provider.SendAsync(r.Email, subject, body);
    }

    public async Task<List<RecipientDto>> GetAuditionRecipientsAsync(Guid auditionDateId, Guid orgId)
    {
        var auditionDate = await _auditionDates.GetByIdAsync(auditionDateId, orgId);
        if (auditionDate is null)
            throw new NotFoundException("Audition date not found");

        var members = await _members.ListAsync(orgId, m => m.IsActive && m.NotificationsEnabled);
        return members
            .Select(m => new RecipientDto(m.Id, $"{m.FirstName} {m.LastName}", m.Email))
            .ToList();
    }

    public async Task SendAuditionAnnouncementAsync(Guid auditionDateId, string subject, string body, Guid orgId)
    {
        var recipients = await GetAuditionRecipientsAsync(auditionDateId, orgId);
        foreach (var r in recipients)
            await _provider.SendAsync(r.Email, subject, body);
    }
}
