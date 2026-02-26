using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class ProjectMaterialsService : IProjectMaterialsService
{
    private readonly IRepository<ProjectLink> _links;
    private readonly IRepository<ProjectDocument> _documents;
    private readonly IStorageProvider _storage;

    public ProjectMaterialsService(
        IRepository<ProjectLink> links,
        IRepository<ProjectDocument> documents,
        IStorageProvider storage)
    {
        _links = links;
        _documents = documents;
        _storage = storage;
    }

    public async Task<List<ProjectLinkDto>> ListLinksAsync(Guid projectId, Guid orgId)
    {
        var links = await _links.ListAsync(orgId, l => l.ProjectId == projectId);
        return links.Select(ToLinkDto).ToList();
    }

    public async Task<ProjectLinkDto> AddLinkAsync(Guid projectId, Guid orgId, AddLinkRequest req)
    {
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["url"] = ["Url must be an http or https URL."]
            });
        }

        var link = new ProjectLink
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProjectId = projectId,
            Title = req.Title,
            Url = req.Url
        };
        await _links.AddAsync(link);
        return ToLinkDto(link);
    }

    public async Task DeleteLinkAsync(Guid linkId, Guid orgId)
    {
        var link = await _links.GetByIdAsync(linkId, orgId);
        if (link is null)
            throw new NotFoundException("Project link not found");
        await _links.DeleteAsync(link);
    }

    public async Task<List<ProjectDocumentDto>> ListDocumentsAsync(Guid projectId, Guid orgId)
    {
        var docs = await _documents.ListAsync(orgId, d => d.ProjectId == projectId);
        return docs.Select(ToDocumentDto).ToList();
    }

    public async Task<ProjectDocumentDto> UploadDocumentAsync(Guid projectId, Guid orgId, string title, string fileName, Stream content)
    {
        var storagePath = await _storage.SaveAsync(fileName, content);
        var doc = new ProjectDocument
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProjectId = projectId,
            Title = title,
            FileName = fileName,
            StoragePath = storagePath
        };
        await _documents.AddAsync(doc);
        return ToDocumentDto(doc);
    }

    public async Task<(Stream stream, string fileName)> GetDocumentStreamAsync(Guid documentId, Guid orgId)
    {
        var doc = await _documents.GetByIdAsync(documentId, orgId);
        if (doc is null)
            throw new NotFoundException("Project document not found");
        var stream = await _storage.GetAsync(doc.StoragePath);
        return (stream, doc.FileName);
    }

    public async Task DeleteDocumentAsync(Guid documentId, Guid orgId)
    {
        var doc = await _documents.GetByIdAsync(documentId, orgId);
        if (doc is null)
            throw new NotFoundException("Project document not found");
        await _storage.DeleteAsync(doc.StoragePath);
        await _documents.DeleteAsync(doc);
    }

    private static ProjectLinkDto ToLinkDto(ProjectLink l) =>
        new(l.Id, l.ProjectId, l.Title, l.Url);

    private static ProjectDocumentDto ToDocumentDto(ProjectDocument d) =>
        new(d.Id, d.ProjectId, d.Title, d.FileName);
}
