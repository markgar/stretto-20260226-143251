using Stretto.Domain.Enums;

namespace Stretto.Domain.Entities;

public class Member
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Role Role { get; set; }
    public bool IsActive { get; set; }
    public bool NotificationOptOut { get; set; }
    public bool NotificationsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid OrganizationId { get; set; }
}
