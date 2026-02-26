using Stretto.Domain.Enums;

namespace Stretto.Domain.Entities;

public class AttendanceRecord
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid MemberId { get; set; }
    public AttendanceStatus Status { get; set; }
    public Guid OrganizationId { get; set; }
}
