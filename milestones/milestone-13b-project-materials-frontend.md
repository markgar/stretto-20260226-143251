## Milestone: Project Materials — Frontend (Admin + Member UI)

> **Validates:**
> - Navigate to a project detail page at `/projects/{id}` (admin session) and click the "Materials" tab — the tab renders without errors (no "Coming soon" placeholder)
> - Admin Materials tab shows an "Add link" form with `data-testid="link-title-input"` and `data-testid="link-url-input"` and `data-testid="add-link-button"`
> - Submitting the add-link form (POST `/api/projects/{projectId}/links`) adds a link to the list
> - Each link row has a `data-testid="delete-link-{id}"` button that calls DELETE `/api/projects/{projectId}/links/{linkId}` and removes it
> - Admin Materials tab shows an "Upload document" file input with `data-testid="upload-document-input"` and `data-testid="upload-document-button"` that POST multipart to `/api/projects/{projectId}/documents`
> - Each document row has a `data-testid="download-document-{id}"` anchor pointing to `/api/projects/{projectId}/documents/{documentId}/download`
> - Each document row has a `data-testid="delete-document-{id}"` button (admin only) that calls DELETE `/api/projects/{projectId}/documents/{documentId}` and removes it
> - Member session: Materials tab renders links as `<a>` tags and document download anchors but has no add-link form and no delete buttons

> **Reference files:**
> - `src/Stretto.Web/src/components/ProjectMembersTab.tsx` — tab component pattern (useQuery, useMutation, useQueryClient, isAdmin guard, loading skeleton, empty state)
> - `src/Stretto.Web/src/components/ProjectEventsTab.tsx` — tab with admin add button pattern
> - `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` — where tab components are rendered (replace "Coming soon" placeholder)
> - `src/Stretto.Web/src/api/generated/services/ProjectMaterialsService.ts` — generated API client methods to call

- [x] Create `src/Stretto.Web/src/components/ProjectMaterialsTab.tsx` that accepts `{ projectId: string }` prop; fetch links with `useQuery(['projectLinks', projectId], () => ProjectMaterialsService.getApiProjectsLinks(projectId))` and documents with `useQuery(['projectDocuments', projectId], () => ProjectMaterialsService.getApiProjectsDocuments(projectId))`; render two sections: "Links" and "Documents"; show loading skeleton (three `h-8 bg-muted rounded animate-pulse` divs) while loading; show "No links yet" / "No documents yet" when lists are empty

- [x] Add the links list to `ProjectMaterialsTab`: render each link as a row with the title as an `<a href={link.url} target="_blank" rel="noreferrer" data-testid={`link-${link.id}`}>` and a delete button `data-testid={`delete-link-${link.id}`}` (admin only) that calls `ProjectMaterialsService.deleteApiProjectsLinks(projectId, link.id)` via `useMutation` and invalidates `['projectLinks', projectId]` on success

- [x] Add the add-link form to `ProjectMaterialsTab` (admin only): use `useForm` with Zod schema `z.object({ title: z.string().min(1), url: z.string().url() })`; render controlled `<input data-testid="link-title-input" />` and `<input data-testid="link-url-input" />`; submit calls `ProjectMaterialsService.postApiProjectsLinks(projectId, { title, url })` via `useMutation`, resets the form on success, and invalidates `['projectLinks', projectId]`; show inline error message on mutation failure

- [x] Add the documents list to `ProjectMaterialsTab`: render each document as a row with the title text, a download anchor `<a href={`/api/projects/${projectId}/documents/${doc.id}/download`} download={doc.fileName} data-testid={`download-document-${doc.id}`}>Download</a>`, and a delete button `data-testid={`delete-document-${doc.id}`}` (admin only) that calls `ProjectMaterialsService.deleteApiProjectsDocuments(projectId, doc.id)` via `useMutation` and invalidates `['projectDocuments', projectId]` on success

- [ ] Add the upload document form to `ProjectMaterialsTab` (admin only): render `<input type="file" data-testid="upload-document-input" />` to capture the file and a `<input type="text" data-testid="upload-document-title-input" />` for the title; render `<button data-testid="upload-document-button">Upload</button>`; on click call `ProjectMaterialsService.postApiProjectsDocuments(projectId, { file: selectedFile, title })` via `useMutation`; invalidate `['projectDocuments', projectId]` on success; show error message on failure; disable button while upload is pending

- [ ] In `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`, replace the `{activeTab === 'materials' && <p className="text-muted-foreground">Coming soon</p>}` placeholder with `{activeTab === 'materials' && <ProjectMaterialsTab projectId={id!} />}`; add the import for `ProjectMaterialsTab`
