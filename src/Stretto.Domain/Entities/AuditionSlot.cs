using Stretto.Domain.Enums;

namespace Stretto.Domain.Entities;

public class AuditionSlot
{
    public Guid Id { get; set; }
    public Guid AuditionDateId { get; set; }
    public TimeOnly SlotTime { get; set; }
    public Guid? MemberId { get; set; }
    public AuditionStatus Status { get; set; }
    public string? Notes { get; set; }
    public Guid OrganizationId { get; set; }
}
