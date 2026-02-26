using Stretto.Application.DTOs;

namespace Stretto.Application.Interfaces;

public interface IProjectMaterialsService
{
    Task<List<ProjectLinkDto>> ListLinksAsync(Guid projectId, Guid orgId);
    Task<ProjectLinkDto> AddLinkAsync(Guid projectId, Guid orgId, AddLinkRequest req);
    Task DeleteLinkAsync(Guid linkId, Guid orgId);
    Task<List<ProjectDocumentDto>> ListDocumentsAsync(Guid projectId, Guid orgId);
    Task<ProjectDocumentDto> UploadDocumentAsync(Guid projectId, Guid orgId, string title, string fileName, Stream content);
    Task<(Stream stream, string fileName)> GetDocumentStreamAsync(Guid documentId, Guid orgId);
    Task DeleteDocumentAsync(Guid documentId, Guid orgId);
}
