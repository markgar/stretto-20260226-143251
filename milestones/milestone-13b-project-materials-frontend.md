## Milestone: Project Materials — Frontend (React UI)

> **Validates:**
> - `GET /projects/{id}` in browser → project detail page renders with a Materials tab; clicking the tab shows the add-link form and upload button for admin users

> **Reference files:**
> - `src/Stretto.Web/src/components/ProjectEventsTab.tsx` — tab component pattern (useQuery, admin gate, list with action buttons)
> - `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` — where to wire the Materials tab component

- [ ] Regenerate TypeScript client: run `cd src/Stretto.Web && npm run generate` so `ProjectMaterialsService` with all links and documents endpoints appears in `src/Stretto.Web/src/api/generated/`

- [ ] Cleanup #234 — extract shared `EventTypeBadge` component: create `src/Stretto.Web/src/components/EventTypeBadge.tsx` exporting `EventTypeBadge({ type }: { type: number })` with the Rehearsal/Performance badge markup; update `src/Stretto.Web/src/components/ProjectEventsTab.tsx` and `src/Stretto.Web/src/pages/EventDetailPage.tsx` to remove their local `EventTypeBadge` definitions and import the shared component instead

- [ ] Create `src/Stretto.Web/src/components/ProjectMaterialsTab.tsx` with props `{ projectId: string }`; fetch links with `useQuery` calling `GET /api/projects/{projectId}/links`; fetch documents with `useQuery` calling `GET /api/projects/{projectId}/documents`; if admin: render add-link form (Zod schema `z.object({ title: z.string().min(1), url: z.string().url() })`, `useForm` + `zodResolver`, `useMutation` calling `POST /api/projects/{projectId}/links`, invalidate links query on success, reset form); render upload-document section (uncontrolled file input with `data-testid="document-file-input"` and a title text input, `useMutation` calling `POST /api/projects/{projectId}/documents` with `FormData`, invalidate documents query on success); render links list: each link shows title as `<a href={url} target="_blank">` plus an admin-only delete button (calls `DELETE /api/projects/{projectId}/links/{id}`, invalidates on success); render documents list: each document shows filename, a download anchor pointing to `/api/projects/{projectId}/documents/{id}/download` with `download` attribute, and an admin-only delete button; show empty-state text when lists are empty; add `data-testid` attributes to the add-link form submit button, upload submit button, and each delete button

- [ ] Update `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`: replace `<p className="text-muted-foreground">Coming soon</p>` inside the `activeTab === 'materials'` branch with `<ProjectMaterialsTab projectId={id!} />`; add `import ProjectMaterialsTab from '../components/ProjectMaterialsTab';` at the top
