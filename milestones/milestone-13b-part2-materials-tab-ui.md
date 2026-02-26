## Milestone: Project Materials — Materials Tab UI

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

> **Reference files:**
> - `src/Stretto.Web/src/components/ProjectEventsTab.tsx` — tab component pattern (useQuery, useAuthStore role check, conditional admin controls)
> - `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` — the page that mounts this tab; replace the "Coming soon" placeholder

> **Depends on:** milestone-13b-part1-materials-backend-fixes.md (TypeScript client must be regenerated first)

- [ ] Create `src/Stretto.Web/src/components/ProjectMaterialsTab.tsx`: fetch links with `useQuery(['links', projectId], () => ProjectMaterialsService.getApiProjectsLinks(projectId))` and documents with `useQuery(['documents', projectId], () => ProjectMaterialsService.getApiProjectsDocuments(projectId))`; render a links section and a documents section; show skeleton loaders while loading; read `isAdmin` from `useAuthStore`

- [ ] Add admin "Add link" form to `ProjectMaterialsTab`: controlled by React Hook Form + Zod schema `z.object({ title: z.string().min(1), url: z.string().url() })`; on submit call `useMutation` → `ProjectMaterialsService.postApiProjectsLinks(projectId, { title, url })`; invalidate `['links', projectId]` on success; apply `data-testid` attributes per Validates block

- [ ] Add link list rendering to `ProjectMaterialsTab`: map over fetched links and render each as a row with an anchor (`<a href={url} target="_blank">`) showing the title and, for admins only, a Delete button that calls `ProjectMaterialsService.deleteApiProjectsLinks1(projectId, linkId)` via `useMutation` then invalidates `['links', projectId]`; apply `data-testid="delete-link-{id}"`

- [ ] Add admin document upload form to `ProjectMaterialsTab`: an uncontrolled `<input type="file" data-testid="document-file-input" />` and a Title text input; on submit POST via `ProjectMaterialsService.postApiProjectsDocuments(projectId, formData)` with `FormData` containing `file` and `title`; invalidate `['documents', projectId]` on success; apply `data-testid` attributes per Validates block

- [ ] Add document list rendering to `ProjectMaterialsTab`: map over fetched documents and render each row with a Download button that calls `window.open(downloadUrl)` where `downloadUrl` is built from the project ID and document ID (e.g. `/api/projects/{projectId}/documents/{id}/download`); for admins add a Delete button calling `ProjectMaterialsService.deleteApiProjectsDocuments1` then invalidating `['documents', projectId]`; apply `data-testid` attributes per Validates block

- [ ] Wire `ProjectMaterialsTab` into `ProjectDetailPage.tsx`: replace `<p className="text-muted-foreground">Coming soon</p>` inside `{activeTab === 'materials' && ...}` with `<ProjectMaterialsTab projectId={id!} />`
