using System.ComponentModel.DataAnnotations;

namespace Stretto.Application.DTOs;

public record ProjectLinkDto(Guid Id, Guid ProjectId, string Title, string Url);

public record AddLinkRequest([Required] string Title, [Required] string Url);

public record ProjectDocumentDto(Guid Id, Guid ProjectId, string Title, string FileName);
