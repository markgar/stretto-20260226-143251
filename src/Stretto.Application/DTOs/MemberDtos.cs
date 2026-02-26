using System.ComponentModel.DataAnnotations;

namespace Stretto.Application.DTOs;

public record MemberDto(Guid Id, string FirstName, string LastName, string Email, string Role, bool IsActive, bool NotificationOptOut);

public record MemberAssignmentSummaryDto(Guid ProjectId, string ProjectName);

public record CreateMemberRequest(
    [Required][MaxLength(100)] string FirstName,
    [Required][MaxLength(100)] string LastName,
    [Required][EmailAddress][MaxLength(200)] string Email,
    [Required][MaxLength(10)] string Role);

public record UpdateMemberRequest(
    [Required][MaxLength(100)] string FirstName,
    [Required][MaxLength(100)] string LastName,
    [Required][EmailAddress][MaxLength(200)] string Email,
    [Required][MaxLength(10)] string Role,
    bool IsActive);

public record UpdateMemberProfileRequest(
    [Required][MaxLength(100)] string FirstName,
    [Required][MaxLength(100)] string LastName,
    [Required][EmailAddress][MaxLength(200)] string Email,
    bool NotificationOptOut);
