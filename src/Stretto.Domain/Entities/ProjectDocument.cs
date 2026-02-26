namespace Stretto.Domain.Entities;

public class ProjectDocument
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
}
