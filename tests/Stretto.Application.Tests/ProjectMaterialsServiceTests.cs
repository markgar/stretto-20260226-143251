using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Stub IStorageProvider that stores files in memory for use in service tests.
/// </summary>
internal class InMemoryStorageProvider : IStorageProvider
{
    private readonly Dictionary<string, byte[]> _files = new();

    public Task<string> SaveAsync(string fileName, Stream content)
    {
        var key = $"memory/{Guid.NewGuid()}_{fileName}";
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        _files[key] = ms.ToArray();
        return Task.FromResult(key);
    }

    public Task<Stream> GetAsync(string storagePath)
    {
        if (!_files.TryGetValue(storagePath, out var bytes))
            throw new NotFoundException("Document file not found");
        Stream stream = new MemoryStream(bytes);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storagePath)
    {
        _files.Remove(storagePath);
        return Task.CompletedTask;
    }

    public bool Exists(string storagePath) => _files.ContainsKey(storagePath);
}

/// <summary>
/// Unit tests for ProjectMaterialsService — verifies link and document CRUD
/// using real repositories backed by an in-memory database.
/// </summary>
public class ProjectMaterialsServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD");
    private readonly AppDbContext _db;
    private readonly ProjectMaterialsService _service;
    private readonly InMemoryStorageProvider _storage;

    public ProjectMaterialsServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("ProjectMaterialsServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        var links = new BaseRepository<ProjectLink>(_db);
        var documents = new BaseRepository<ProjectDocument>(_db);
        _storage = new InMemoryStorageProvider();
        _service = new ProjectMaterialsService(links, documents, _storage);
    }

    public void Dispose() => _db.Dispose();

    // ListLinksAsync

    [Fact]
    public async Task ListLinksAsync_returns_only_links_for_the_given_project()
    {
        var projectId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _db.Set<ProjectLink>().AddRange(
            new ProjectLink { Id = Guid.NewGuid(), OrganizationId = OrgId, ProjectId = projectId, Title = "Score", Url = "https://a.com" },
            new ProjectLink { Id = Guid.NewGuid(), OrganizationId = OrgId, ProjectId = otherId, Title = "Other", Url = "https://b.com" }
        );
        await _db.SaveChangesAsync();

        var result = await _service.ListLinksAsync(projectId, OrgId);

        Assert.Single(result);
        Assert.Equal("Score", result[0].Title);
    }

    // AddLinkAsync

    [Fact]
    public async Task AddLinkAsync_persists_link_and_returns_dto_with_correct_fields()
    {
        var projectId = Guid.NewGuid();
        var req = new AddLinkRequest("Practice Recording", "https://recording.example.com");

        var dto = await _service.AddLinkAsync(projectId, OrgId, req);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal(projectId, dto.ProjectId);
        Assert.Equal("Practice Recording", dto.Title);
        Assert.Equal("https://recording.example.com", dto.Url);
    }

    // DeleteLinkAsync

    [Fact]
    public async Task DeleteLinkAsync_removes_existing_link_from_store()
    {
        var projectId = Guid.NewGuid();
        var link = new ProjectLink { Id = Guid.NewGuid(), OrganizationId = OrgId, ProjectId = projectId, Title = "T", Url = "https://t.com" };
        _db.Set<ProjectLink>().Add(link);
        await _db.SaveChangesAsync();

        await _service.DeleteLinkAsync(link.Id, OrgId);

        var remaining = await _service.ListLinksAsync(projectId, OrgId);
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task DeleteLinkAsync_throws_NotFoundException_when_link_does_not_exist()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteLinkAsync(Guid.NewGuid(), OrgId));
    }

    // UploadDocumentAsync

    [Fact]
    public async Task UploadDocumentAsync_saves_to_storage_and_returns_dto()
    {
        var projectId = Guid.NewGuid();
        using var content = new MemoryStream("file bytes"u8.ToArray());

        var dto = await _service.UploadDocumentAsync(projectId, OrgId, "Sheet Music", "sheet.pdf", content);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal(projectId, dto.ProjectId);
        Assert.Equal("Sheet Music", dto.Title);
        Assert.Equal("sheet.pdf", dto.FileName);
    }

    // ListDocumentsAsync

    [Fact]
    public async Task ListDocumentsAsync_returns_only_documents_for_the_given_project()
    {
        var projectId = Guid.NewGuid();
        using var content = new MemoryStream("data"u8.ToArray());
        await _service.UploadDocumentAsync(projectId, OrgId, "Doc A", "a.pdf", content);

        var otherProjectId = Guid.NewGuid();
        using var content2 = new MemoryStream("data2"u8.ToArray());
        await _service.UploadDocumentAsync(otherProjectId, OrgId, "Doc B", "b.pdf", content2);

        var result = await _service.ListDocumentsAsync(projectId, OrgId);

        Assert.Single(result);
        Assert.Equal("Doc A", result[0].Title);
    }

    // GetDocumentStreamAsync

    [Fact]
    public async Task GetDocumentStreamAsync_returns_stream_and_filename_for_uploaded_document()
    {
        var projectId = Guid.NewGuid();
        var bytes = "hello world"u8.ToArray();
        using var uploadStream = new MemoryStream(bytes);
        var dto = await _service.UploadDocumentAsync(projectId, OrgId, "Notes", "notes.txt", uploadStream);

        var (stream, fileName) = await _service.GetDocumentStreamAsync(dto.Id, OrgId);

        Assert.Equal("notes.txt", fileName);
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        Assert.Equal(bytes, ms.ToArray());
    }

    [Fact]
    public async Task GetDocumentStreamAsync_throws_NotFoundException_when_document_does_not_exist()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetDocumentStreamAsync(Guid.NewGuid(), OrgId));
    }

    // DeleteDocumentAsync

    [Fact]
    public async Task DeleteDocumentAsync_removes_document_from_db_and_storage()
    {
        var projectId = Guid.NewGuid();
        using var content = new MemoryStream("data"u8.ToArray());
        var dto = await _service.UploadDocumentAsync(projectId, OrgId, "Tmp", "tmp.pdf", content);

        await _service.DeleteDocumentAsync(dto.Id, OrgId);

        var remaining = await _service.ListDocumentsAsync(projectId, OrgId);
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task DeleteDocumentAsync_throws_NotFoundException_when_document_does_not_exist()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteDocumentAsync(Guid.NewGuid(), OrgId));
    }
}
