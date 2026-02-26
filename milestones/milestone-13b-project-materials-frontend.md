## Milestone: Project Materials — Frontend (Materials Tab UI + Backend Fixes)

> **Validates:**
> - Admin visits `/projects/{id}` and clicks the Materials tab → tab renders (not "Coming soon")
> - Admin Materials tab shows an "Add link" form with Title and URL inputs and a Submit button (`data-testid="add-link-form"`, `data-testid="link-title-input"`, `data-testid="link-url-input"`, `data-testid="add-link-submit"`)
> - Submitting a valid link (title + https URL) sends `POST /api/projects/{id}/links` and the new link appears in the list
> - Each link in the list shows the title as a clickable anchor and a Delete button (`data-testid="delete-link-{id}"`) visible only to admins
> - Admin Materials tab shows an "Upload document" file input and Upload button (`data-testid="document-file-input"`, `data-testid="upload-document-submit"`)
> - Uploading a file sends `POST /api/projects/{id}/documents` (multipart) and the document appears in the list
> - Each document row has a Download button (`data-testid="download-document-{id}"`) that triggers `GET /api/projects/{id}/documents/{documentId}/download`
> - Admin document rows show a Delete button (`data-testid="delete-document-{id}"`)
> - Member (non-admin) visiting the same tab sees links and download buttons but no Add/Upload/Delete controls
> - `POST /api/projects/{id}/links` with a `javascript:` URL → 400 Bad Request
> - `POST /api/projects/{id}/links` for a projectId that does not belong to the org → 404 Not Found
> - `POST /api/projects/{id}/documents` with no file attached → 400 Bad Request
> - `GET /api/projects/{id}/documents/{documentId}/download` with a path-traversal filename on disk returns the expected file without escaping the upload root

> **Reference files:**
> - `src/Stretto.Web/src/components/ProjectEventsTab.tsx` — tab component pattern (useQuery, useAuthStore role check, conditional admin controls)
> - `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` — the page that mounts this tab; replace the "Coming soon" placeholder
> - `src/Stretto.Web/src/api/generated/services/EventsService.ts` — generated service shape to understand how ProjectMaterialsService will look after regeneration
> - `src/Stretto.Application/Services/ProjectMaterialsService.cs` — service to modify for validation fixes
> - `src/Stretto.Infrastructure/LocalFileStorageProvider.cs` — storage provider to fix for path traversal

- [ ] Fix `ProjectMaterialsService.AddLinkAsync`: load the project by `projectId` from `IRepository<Project>` and throw `NotFoundException("Project not found")` if the project does not exist or its `OrganizationId` does not match `orgId`; inject `IRepository<Project>` into the constructor

- [ ] Fix `ProjectMaterialsService.UploadDocumentAsync`: load the project by `projectId` the same way and throw `NotFoundException("Project not found")` if missing or org-mismatched

- [ ] Fix `AddLinkRequest` validation in `src/Stretto.Application/DTOs/ProjectMaterialsDtos.cs`: add a `[RegularExpression(@"^https?://.*", ErrorMessage = "URL must start with http:// or https://")]` attribute on the `Url` property so javascript: and other schemes are rejected with 400

- [ ] Fix `LocalFileStorageProvider.SaveAsync` in `src/Stretto.Infrastructure/LocalFileStorageProvider.cs`: sanitize the filename before constructing the storage path — replace any directory-separator characters (`Path.GetInvalidFileNameChars()`) using `Path.GetFileName(fileName)` so callers cannot inject `../` sequences into the stored path

- [ ] Fix document upload endpoint in `src/Stretto.Api/Controllers/ProjectMaterialsController.cs`: add an explicit null/empty check on the `IFormFile file` parameter at the start of the action and return `BadRequest("A file is required")` if `file == null || file.Length == 0`

- [ ] Regenerate TypeScript API client: run `npm run generate` inside `src/Stretto.Web` to produce `ProjectMaterialsService` (with `getApiProjectsLinks`, `postApiProjectsLinks`, `deleteApiProjectsLinks1`, `getApiProjectsDocuments`, `postApiProjectsDocuments`, `getApiProjectsDocumentsDownload`, `deleteApiProjectsDocuments1`) in `src/Stretto.Web/src/api/generated/services/`

- [ ] Create `src/Stretto.Web/src/components/ProjectMaterialsTab.tsx`: fetch links with `useQuery(['links', projectId], () => ProjectMaterialsService.getApiProjectsLinks(projectId))` and documents with `useQuery(['documents', projectId], () => ProjectMaterialsService.getApiProjectsDocuments(projectId))`; render a links section and a documents section; show skeleton loaders while loading; read `isAdmin` from `useAuthStore`

- [ ] Add admin "Add link" form to `ProjectMaterialsTab`: controlled by React Hook Form + Zod schema `z.object({ title: z.string().min(1), url: z.string().url() })`; on submit call `useMutation` → `ProjectMaterialsService.postApiProjectsLinks(projectId, { title, url })`; invalidate `['links', projectId]` on success; apply `data-testid` attributes per Validates block

- [ ] Add link list rendering to `ProjectMaterialsTab`: map over fetched links and render each as a row with an anchor (`<a href={url} target="_blank">`) showing the title and, for admins only, a Delete button that calls `ProjectMaterialsService.deleteApiProjectsLinks1(projectId, linkId)` via `useMutation` then invalidates `['links', projectId]`; apply `data-testid="delete-link-{id}"`

- [ ] Add admin document upload form to `ProjectMaterialsTab`: an uncontrolled `<input type="file" data-testid="document-file-input" />` and a Title text input; on submit POST via `ProjectMaterialsService.postApiProjectsDocuments(projectId, formData)` with `FormData` containing `file` and `title`; invalidate `['documents', projectId]` on success; apply `data-testid` attributes per Validates block

- [ ] Add document list rendering to `ProjectMaterialsTab`: map over fetched documents and render each row with a Download button that calls `window.open(downloadUrl)` where `downloadUrl` is built from the project ID and document ID (e.g. `/api/projects/{projectId}/documents/{id}/download`); for admins add a Delete button calling `ProjectMaterialsService.deleteApiProjectsDocuments1` then invalidating `['documents', projectId]`; apply `data-testid` attributes per Validates block

- [ ] Wire `ProjectMaterialsTab` into `ProjectDetailPage.tsx`: replace `<p className="text-muted-foreground">Coming soon</p>` inside `{activeTab === 'materials' && ...}` with `<ProjectMaterialsTab projectId={id!} />`
