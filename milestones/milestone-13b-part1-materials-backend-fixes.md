## Milestone: Project Materials — Backend Fixes & API Client Regeneration

> **Validates:**
> - `POST /api/projects/{id}/links` with a `javascript:` URL → 400 Bad Request
> - `POST /api/projects/{id}/links` for a projectId that does not belong to the org → 404 Not Found
> - `POST /api/projects/{id}/documents` with no file attached → 400 Bad Request
> - `GET /api/projects/{id}/documents/{documentId}/download` with a path-traversal filename on disk returns the expected file without escaping the upload root

> **Reference files:**
> - `src/Stretto.Application/Services/ProjectMaterialsService.cs` — service to modify for validation fixes
> - `src/Stretto.Infrastructure/LocalFileStorageProvider.cs` — storage provider to fix for path traversal
> - `src/Stretto.Web/src/api/generated/services/EventsService.ts` — generated service shape to understand how ProjectMaterialsService will look after regeneration

- [ ] Fix `ProjectMaterialsService.AddLinkAsync`: load the project by `projectId` from `IRepository<Project>` and throw `NotFoundException("Project not found")` if the project does not exist or its `OrganizationId` does not match `orgId`; inject `IRepository<Project>` into the constructor

- [ ] Fix `ProjectMaterialsService.UploadDocumentAsync`: load the project by `projectId` the same way and throw `NotFoundException("Project not found")` if missing or org-mismatched

- [ ] Fix `AddLinkRequest` validation in `src/Stretto.Application/DTOs/ProjectMaterialsDtos.cs`: add a `[RegularExpression(@"^https?://.*", ErrorMessage = "URL must start with http:// or https://")]` attribute on the `Url` property so javascript: and other schemes are rejected with 400

- [ ] Fix `LocalFileStorageProvider.SaveAsync` in `src/Stretto.Infrastructure/LocalFileStorageProvider.cs`: sanitize the filename before constructing the storage path — replace any directory-separator characters (`Path.GetInvalidFileNameChars()`) using `Path.GetFileName(fileName)` so callers cannot inject `../` sequences into the stored path

- [ ] Fix document upload endpoint in `src/Stretto.Api/Controllers/ProjectMaterialsController.cs`: add an explicit null/empty check on the `IFormFile file` parameter at the start of the action and return `BadRequest("A file is required")` if `file == null || file.Length == 0`

- [ ] Regenerate TypeScript API client: run `npm run generate` inside `src/Stretto.Web` to produce `ProjectMaterialsService` (with `getApiProjectsLinks`, `postApiProjectsLinks`, `deleteApiProjectsLinks1`, `getApiProjectsDocuments`, `postApiProjectsDocuments`, `getApiProjectsDocumentsDownload`, `deleteApiProjectsDocuments1`) in `src/Stretto.Web/src/api/generated/services/`
