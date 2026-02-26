using Microsoft.AspNetCore.Mvc;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}")]
public class ProjectMaterialsController : ProtectedControllerBase
{
    private readonly IProjectMaterialsService _materials;

    public ProjectMaterialsController(IProjectMaterialsService materials, IAuthService authService)
        : base(authService)
    {
        _materials = materials;
    }

    [HttpGet("links")]
    public async Task<IActionResult> ListLinks(Guid projectId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var list = await _materials.ListLinksAsync(projectId, orgId);
        return Ok(list);
    }

    [HttpPost("links")]
    public async Task<IActionResult> AddLink(Guid projectId, [FromBody] AddLinkRequest req)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can add links");
        var dto = await _materials.AddLinkAsync(projectId, orgId, req);
        return Created($"/api/projects/{projectId}/links/{dto.Id}", dto);
    }

    [HttpDelete("links/{linkId:guid}")]
    public async Task<IActionResult> DeleteLink(Guid projectId, Guid linkId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete links");
        await _materials.DeleteLinkAsync(linkId, orgId);
        return NoContent();
    }

    [HttpGet("documents")]
    public async Task<IActionResult> ListDocuments(Guid projectId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var list = await _materials.ListDocumentsAsync(projectId, orgId);
        return Ok(list);
    }

    [HttpPost("documents")]
    public async Task<IActionResult> UploadDocument(Guid projectId, IFormFile? file, [FromForm] string title)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can upload documents");
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "A file must be provided." });
        await using var stream = file.OpenReadStream();
        var dto = await _materials.UploadDocumentAsync(projectId, orgId, title, file.FileName, stream);
        return Created($"/api/projects/{projectId}/documents/{dto.Id}", dto);
    }

    [HttpGet("documents/{documentId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid projectId, Guid documentId)
    {
        var (orgId, _, _) = await GetSessionAsync();
        var (stream, fileName) = await _materials.GetDocumentStreamAsync(documentId, orgId);
        return File(stream, "application/octet-stream", fileName);
    }

    [HttpDelete("documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid projectId, Guid documentId)
    {
        var (orgId, role, _) = await GetSessionAsync();
        if (role != "Admin")
            throw new ForbiddenException("Only admins can delete documents");
        await _materials.DeleteDocumentAsync(documentId, orgId);
        return NoContent();
    }
}
