## Milestone: Member Assignments + Utilization Grid – Frontend

> **Validates:**
> - React app at `/projects/:id` shows a Members tab that lists all org members with Assign/Unassign buttons
> - React app at `/utilization` renders the utilization grid (matrix on desktop, list by member on mobile)

> **Reference files:**
> - Frontend tab: `src/Stretto.Web/src/components/ProjectEventsTab.tsx`
> - Frontend page: `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`
> - Generated client: `src/Stretto.Web/src/api/generated/`

> **Depends on:** milestone-08a (backend must be complete and API running before regenerating the client)

---

### TypeScript Client

- [x] Regenerate the TypeScript API client by running `npm run generate` inside `src/Stretto.Web`. Verify the output in `src/Stretto.Web/src/api/generated/` contains new `ProjectAssignmentsService` (or similar) entries for the three new endpoints and that all previously existing service files (`AuditionDatesService`, `AuditionSlotsService`, `AttendanceService`, `EventsService`, `MembersService`, `ProgramYearsService`, `ProjectsService`, `PublicAuditionsService`, `VenuesService`, `AuthService`) are still present and unmodified. If `npm run generate` drops any existing file, do NOT commit; instead manually write only the new generated types/service files needed for assignments and utilization

---

### Frontend

- [x] Create `src/Stretto.Web/src/components/ProjectMembersTab.tsx`. Props: `{ projectId: string }`. Use `useQuery` to fetch `GET /api/projects/{projectId}/members` via the generated client (e.g. `ProjectsService.getApiProjectsMembers(projectId)`). Use `useMutation` for assign and unassign via the generated client — `onError` must display an inline error message; `onSuccess` must call `queryClient.invalidateQueries(['projectMembers', projectId])`. Show a text `<input>` with `data-testid="member-search-input"` that filters the displayed list by name or email. For each member row show the member's full name, email, an "Assign" button (`data-testid="assign-{memberId}"`) when `isAssigned === false`, and an "Unassign" button (`data-testid="unassign-{memberId}"`) when `isAssigned === true`. Buttons are disabled while a mutation is pending. Show a skeleton loader while data loads and an empty state when the list is empty

- [x] Update `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`: replace the `{activeTab === 'members' && <p className="text-muted-foreground">Coming soon</p>}` block with `{activeTab === 'members' && <ProjectMembersTab projectId={id!} />}` and add the import

- [ ] Create `src/Stretto.Web/src/pages/UtilizationGridPage.tsx`. Use `useQuery` to load the list of program years (`ProgramYearsService`). Use a `<select>` (`data-testid="program-year-select"`) to pick which program year to view. Use a second `useQuery` keyed on the selected program year ID to fetch `GET /api/program-years/{id}/utilization` via the generated client. **Desktop layout** (`md:block hidden`): render a full `<table>` where each row is a member, each column after the first two is a project, and a cell is filled with `bg-indigo-600` when `assignedProjectIds` contains that project's ID or left as `bg-muted` when not; first column = member full name, second column = `{assignedCount}/{totalProjects}` utilization count; column headers = project names (truncated to 20 chars with `title` tooltip). **Mobile layout** (`md:hidden block`): render a list grouped by member — each item shows member name, utilization fraction, and a comma-separated list of assigned project names. Show a skeleton loader while loading. Show a friendly empty state when no program year is selected or no data exists

- [ ] Update `src/Stretto.Web/src/App.tsx`: replace the `<Route path="/utilization" element={<ComingSoon />} />` line with `<Route path="/utilization" element={<UtilizationGridPage />} />` and add the import
