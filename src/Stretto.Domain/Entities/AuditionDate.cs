namespace Stretto.Domain.Entities;

public class AuditionDate
{
    public Guid Id { get; set; }
    public Guid ProgramYearId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int BlockLengthMinutes { get; set; }
    public Guid OrganizationId { get; set; }
}
