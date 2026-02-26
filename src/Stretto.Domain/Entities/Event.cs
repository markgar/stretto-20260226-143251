using Stretto.Domain.Enums;

namespace Stretto.Domain.Entities;

public class Event
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public EventType EventType { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public Guid? VenueId { get; set; }
    public Guid OrganizationId { get; set; }
}
