## Milestone: Member Assignments — Frontend + Utilization Grid

> **Validates:**
> - `GET /projects/{id}` renders the project detail page; clicking the "Members" tab shows a member list with assign/unassign buttons
> - `GET /utilization` renders the Utilization Grid page (not "Coming soon")

> **Reference files:**
> - Tab component: `src/Stretto.Web/src/components/ProjectEventsTab.tsx`
> - Page with tabs: `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`

---

- [ ] Regenerate TypeScript API client — ensure the backend is running (or swagger.json is up to date), then run `cd src/Stretto.Web && npm run generate`; commit the updated files in `src/api/generated/`

- [ ] Create `src/Stretto.Web/src/components/ProjectMembersTab.tsx` — fetches `GET /api/projects/{projectId}/assignments` via `useQuery`; renders a search `<input data-testid="member-search" />` that filters the list client-side by name/email; for each member renders a row with full name, email, and (if Admin) a toggle button `<button data-testid="toggle-assignment-{memberId}">` that calls `POST` or `DELETE` via `useMutation` based on current `isAssigned` value; `onError` handler sets a visible error message (fixing finding #188 on the frontend side); `queryClient.invalidateQueries` on success

- [ ] Update `ProjectDetailPage.tsx` — replace `<p className="text-muted-foreground">Coming soon</p>` inside `{activeTab === 'members' && ...}` with `<ProjectMembersTab projectId={id!} />`; add the import for `ProjectMembersTab`

- [ ] Create `src/Stretto.Web/src/pages/UtilizationGridPage.tsx` — fetches program years via `useQuery` to populate a `<select data-testid="program-year-select" />`; on year selection fetches `GET /api/utilization?programYearId={id}` via `useQuery`; on desktop (`md` and above) renders a table: member rows (firstName lastName, count, percentage) × project columns with a filled accent cell (`bg-primary/20`) when assigned, plain empty cell otherwise; on mobile renders a list-by-member showing name, assignment count (e.g. "3 / 5 projects"), and percentage; loading skeleton while fetching; empty state when no program year selected or no data

- [ ] Update `App.tsx` — import `UtilizationGridPage` from `./pages/UtilizationGridPage`; replace `<ComingSoon />` at path `/utilization` with `<UtilizationGridPage />`
