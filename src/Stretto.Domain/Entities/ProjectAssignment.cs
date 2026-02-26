namespace Stretto.Domain.Entities;

public class ProjectAssignment
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid MemberId { get; set; }
    public Guid OrganizationId { get; set; }
}
