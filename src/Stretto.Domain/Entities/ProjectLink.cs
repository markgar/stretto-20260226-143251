namespace Stretto.Domain.Entities;

public class ProjectLink
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
}
