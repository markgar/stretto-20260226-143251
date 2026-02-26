## Milestone: Project Materials — Backend (Links and Documents API)

> **Validates:**
> - `POST /api/projects/{projectId}/links` (admin session, JSON body `{ "title": "Score", "url": "https://example.com" }`) → 201 Created with `{ id, projectId, title, url }`
> - `GET /api/projects/{projectId}/links` (any authenticated session) → 200 with JSON array
> - `DELETE /api/projects/{projectId}/links/{linkId}` (admin session) → 204 No Content
> - `POST /api/projects/{projectId}/documents` (admin session, multipart/form-data with `file` and `title` fields) → 201 Created with `{ id, projectId, title, fileName }`
> - `GET /api/projects/{projectId}/documents` (any authenticated session) → 200 with JSON array
> - `GET /api/projects/{projectId}/documents/{documentId}/download` (any authenticated session) → 200 with `Content-Disposition: attachment` header and file bytes
> - `DELETE /api/projects/{projectId}/documents/{documentId}` (admin session) → 204 No Content

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProjectLink.cs` — entity shape for ProjectLink (already exists)
> - `src/Stretto.Application/Interfaces/IStorageProvider.cs` — existing IStorageProvider interface to implement
> - `src/Stretto.Application/Services/EventService.cs` — service implementation pattern (IRepository injection, NotFoundException, ToDto helpers)
> - `src/Stretto.Api/Controllers/EventsController.cs` — controller pattern (ProtectedControllerBase, GetSessionAsync, role check, HTTP verbs)
> - `src/Stretto.Api/Program.cs` — DI registration location

- [x] Create `src/Stretto.Application/DTOs/ProjectMaterialsDtos.cs` with records: `ProjectLinkDto(Guid Id, Guid ProjectId, string Title, string Url)`, `AddLinkRequest([Required] string Title, [Required] string Url)`, `ProjectDocumentDto(Guid Id, Guid ProjectId, string Title, string FileName)`

- [ ] Create `src/Stretto.Application/Interfaces/IProjectMaterialsService.cs` with method signatures: `Task<List<ProjectLinkDto>> ListLinksAsync(Guid projectId, Guid orgId)`, `Task<ProjectLinkDto> AddLinkAsync(Guid projectId, Guid orgId, AddLinkRequest req)`, `Task DeleteLinkAsync(Guid linkId, Guid orgId)`, `Task<List<ProjectDocumentDto>> ListDocumentsAsync(Guid projectId, Guid orgId)`, `Task<ProjectDocumentDto> UploadDocumentAsync(Guid projectId, Guid orgId, string title, string fileName, Stream content)`, `Task<(Stream stream, string fileName)> GetDocumentStreamAsync(Guid documentId, Guid orgId)`, `Task DeleteDocumentAsync(Guid documentId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/ProjectMaterialsService.cs` implementing `IProjectMaterialsService`; inject `IRepository<ProjectLink>`, `IRepository<ProjectDocument>`, and `IStorageProvider`; throw `NotFoundException("Project link not found")` or `NotFoundException("Project document not found")` when the entity is missing; `UploadDocumentAsync` calls `IStorageProvider.SaveAsync` then persists a `ProjectDocument` with the returned `StoragePath`; `GetDocumentStreamAsync` loads the document then calls `IStorageProvider.GetAsync(doc.StoragePath)`; `DeleteDocumentAsync` calls `IStorageProvider.DeleteAsync` then removes the DB row; private `ToLinkDto` and `ToDocumentDto` helper methods

- [ ] Create `src/Stretto.Infrastructure/LocalFileStorageProvider.cs` implementing `IStorageProvider`; read upload root from `IConfiguration["Storage:UploadPath"]` defaulting to `"uploads"`; `SaveAsync(fileName, content)` — create the directory if it does not exist, write stream to a file named `{Guid.NewGuid()}_{fileName}` inside the upload root, return the relative path; `GetAsync(storagePath)` — return `File.OpenRead(storagePath)` wrapped in a try/catch that throws `NotFoundException("Document file not found")`; `DeleteAsync(storagePath)` — call `File.Delete` only if the file exists

- [ ] Register services in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IStorageProvider, LocalFileStorageProvider>()` and `builder.Services.AddScoped<IProjectMaterialsService, ProjectMaterialsService>()`; add `using Stretto.Infrastructure;` if needed

- [ ] Create `src/Stretto.Api/Controllers/ProjectMaterialsController.cs` with route `[Route("api/projects/{projectId:guid}")]` extending `ProtectedControllerBase`; implement links endpoints: `GET /links` → 200 list (all roles), `POST /links` → 201 Created with location header (admin only, `[FromBody] AddLinkRequest`), `DELETE /links/{linkId:guid}` → 204 (admin only); implement documents endpoints: `GET /documents` → 200 list (all roles), `POST /documents` → 201 Created (admin only, `[FromForm] IFormFile file, [FromForm] string title`, call `UploadDocumentAsync`), `GET /documents/{documentId:guid}/download` → `FileStreamResult` with `Content-Disposition: attachment; filename="{fileName}"` (all roles), `DELETE /documents/{documentId:guid}` → 204 (admin only); throw `ForbiddenException` for role violations
