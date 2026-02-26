using System.ComponentModel.DataAnnotations;

namespace Stretto.Application.DTOs;

public record RecipientDto(Guid MemberId, string Name, string Email);

public record SendAssignmentAnnouncementRequest(
    Guid ProgramYearId,
    [Required] string Subject,
    [Required] string Body);

public record SendAuditionAnnouncementRequest(
    Guid AuditionDateId,
    [Required] string Subject,
    [Required] string Body);
