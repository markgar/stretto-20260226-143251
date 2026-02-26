namespace Stretto.Domain.Entities;

public class ProgramYear
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsArchived { get; set; }
    public Guid OrganizationId { get; set; }
}
