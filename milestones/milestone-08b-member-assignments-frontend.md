## Milestone: Member Assignments — Frontend

> **Validates:**
> - Browser navigates to `/projects` and the project list page renders (not "Coming soon")
> - Browser navigates to `/projects/{id}` and the project detail page renders with a Members tab that shows a member list with assign/unassign buttons

> **Reference files:**
> - `src/Stretto.Web/src/App.tsx` — route definitions; replace `ComingSoon` placeholders with real page components
> - `src/Stretto.Web/src/pages/MembersListPage.tsx` — frontend pattern: `useQuery` with raw `fetch(..., { credentials: 'include' })`, Tailwind + shadcn/ui, `data-testid` on interactive elements

- [ ] Create `src/Stretto.Web/src/pages/ProjectsListPage.tsx`; `useQuery` to fetch `/api/projects?programYearId={programYearId}` with `credentials: 'include'`; if no `programYearId` param, show a program-year selector dropdown (fetch from `/api/program-years`); render a list of project cards showing `name`, `startDate`, `endDate` with a link to `/projects/{id}`; `data-testid="projects-heading"` on the page heading; `data-testid="project-item"` on each project card

- [ ] Create `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` with tab navigation (Overview, Members); Overview tab shows project name, program year, start/end dates; Members tab renders `ProjectMembersTab` component (imported from same directory); use `useParams` to get project id; `data-testid="project-detail-heading"` on the project name heading; `data-testid="tab-overview"` and `data-testid="tab-members"` on the tab buttons

- [ ] Create `src/Stretto.Web/src/pages/ProjectMembersTab.tsx`; props: `projectId: string`; section 1 "Assigned Members" — `useQuery` to fetch `/api/projects/{projectId}/members`, renders list with `data-testid="assigned-member-item"` and an Unassign button (`data-testid="unassign-button-{memberId}"`) that calls `DELETE /api/projects/{projectId}/members/{memberId}` via `useMutation`, then invalidates query; section 2 "Add Member" — search input (`data-testid="member-search-input"`) with `useQuery` to fetch `/api/members?search={q}` filtered to exclude already-assigned members; each result row has an Assign button (`data-testid="assign-button-{memberId}"`) that calls `POST /api/projects/{projectId}/members/{memberId}` via `useMutation`, then invalidates both queries

- [ ] Update `src/Stretto.Web/src/App.tsx`: add imports for `ProjectsListPage` and `ProjectDetailPage`; replace the `<Route path="/projects" element={<ComingSoon />} />` with `<Route path="/projects" element={<ProjectsListPage />} />`; add `<Route path="/projects/:id" element={<ProjectDetailPage />} />`
