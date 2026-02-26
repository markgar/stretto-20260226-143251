using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface INotificationService
{
    Task<List<RecipientDto>> GetAssignmentRecipientsAsync(Guid programYearId, Guid orgId);
    Task SendAssignmentAnnouncementAsync(Guid programYearId, string subject, string body, Guid orgId);
    Task<List<RecipientDto>> GetAuditionRecipientsAsync(Guid auditionDateId, Guid orgId);
    Task SendAuditionAnnouncementAsync(Guid auditionDateId, string subject, string body, Guid orgId);
}
