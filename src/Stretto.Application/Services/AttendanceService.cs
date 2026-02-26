using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IRepository<Event> _events;
    private readonly IRepository<ProjectAssignment> _assignments;
    private readonly IRepository<AttendanceRecord> _records;
    private readonly IRepository<Member> _members;

    public AttendanceService(
        IRepository<Event> events,
        IRepository<ProjectAssignment> assignments,
        IRepository<AttendanceRecord> records,
        IRepository<Member> members)
    {
        _events = events;
        _assignments = assignments;
        _records = records;
        _members = members;
    }

    public async Task<List<AttendanceSummaryItemDto>> GetForEventAsync(Guid eventId, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(eventId, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var projectAssignments = await _assignments.ListAsync(orgId, a => a.ProjectId == ev.ProjectId);
        var memberIds = projectAssignments.Select(a => a.MemberId).ToHashSet();

        var memberList = await _members.ListAsync(orgId, m => memberIds.Contains(m.Id));
        var memberMap = memberList.ToDictionary(m => m.Id, m => $"{m.FirstName} {m.LastName}");

        var attendanceRecords = await _records.ListAsync(orgId, r => r.EventId == eventId);
        var recordMap = attendanceRecords.ToDictionary(r => r.MemberId, r => r.Status.ToString());

        return memberMap.Select(kvp => new AttendanceSummaryItemDto(
            kvp.Key,
            kvp.Value,
            recordMap.TryGetValue(kvp.Key, out var status) ? status : null
        )).ToList();
    }

    public async Task<AttendanceSummaryItemDto?> GetMyRecordAsync(Guid eventId, Guid memberId, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(eventId, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var member = await _members.GetByIdAsync(memberId, orgId);
        if (member is null)
            throw new NotFoundException("Member not found");

        var record = await _records.FindOneAsync(r => r.EventId == eventId && r.MemberId == memberId && r.OrganizationId == orgId);
        return new AttendanceSummaryItemDto(
            memberId,
            $"{member.FirstName} {member.LastName}",
            record?.Status.ToString());
    }

    public async Task<AttendanceRecordDto> SetStatusAsync(Guid eventId, Guid memberId, Guid orgId, AttendanceStatus status)
    {
        var ev = await _events.GetByIdAsync(eventId, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var record = await _records.FindOneAsync(r => r.EventId == eventId && r.MemberId == memberId && r.OrganizationId == orgId);
        if (record is null)
        {
            record = new AttendanceRecord
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                MemberId = memberId,
                OrganizationId = orgId,
                Status = status
            };
            await _records.AddAsync(record);
        }
        else
        {
            record.Status = status;
            await _records.UpdateAsync(record);
        }
        return ToDto(record);
    }

    public async Task<AttendanceRecordDto> CheckInAsync(Guid eventId, Guid memberId, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(eventId, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var assignment = await _assignments.FindOneAsync(
            a => a.ProjectId == ev.ProjectId && a.MemberId == memberId && a.OrganizationId == orgId);
        if (assignment is null)
            throw new ForbiddenException("Member is not assigned to this event's project");

        return await SetStatusAsync(eventId, memberId, orgId, AttendanceStatus.Present);
    }

    public async Task<AttendanceRecordDto> ToggleExcusedAsync(Guid eventId, Guid memberId, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(eventId, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var assignment = await _assignments.FindOneAsync(
            a => a.ProjectId == ev.ProjectId && a.MemberId == memberId && a.OrganizationId == orgId);
        if (assignment is null)
            throw new ForbiddenException("Member is not assigned to this event's project");

        var record = await _records.FindOneAsync(r => r.EventId == eventId && r.MemberId == memberId && r.OrganizationId == orgId);
        if (record is null)
        {
            record = new AttendanceRecord
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                MemberId = memberId,
                OrganizationId = orgId,
                Status = AttendanceStatus.Excused
            };
            await _records.AddAsync(record);
        }
        else
        {
            record.Status = record.Status == AttendanceStatus.Excused
                ? AttendanceStatus.Absent
                : AttendanceStatus.Excused;
            await _records.UpdateAsync(record);
        }
        return ToDto(record);
    }

    private static AttendanceRecordDto ToDto(AttendanceRecord r) =>
        new AttendanceRecordDto(r.Id, r.EventId, r.MemberId, r.Status.ToString());
}
