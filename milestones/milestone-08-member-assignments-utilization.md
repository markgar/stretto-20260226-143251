## Milestone: Member Assignments + Utilization Grid

> **Validates:**
> - `POST /api/projects/{projectId}/members` with body `{"memberId":"<guid>"}` returns 201 when the member is not yet assigned
> - `DELETE /api/projects/{projectId}/members/{memberId}` returns 204 when the assignment exists
> - `GET /api/projects/{projectId}/members` returns 200 with a JSON array of members (each with `memberId`, `fullName`, `email`, `isAssigned`)
> - `GET /api/program-years/{programYearId}/utilization` returns 200 with `{ projects: [...], members: [...] }` where each member has `assignedCount`, `totalProjects`, `assignedProjectIds`
> - `GET /api/projects/{projectId}/members` for a non-existent projectId returns 404
> - `GET /api/program-years/{programYearId}/utilization` for a non-existent programYearId returns 404
> - React app at `/projects/:id` shows a Members tab that lists all org members with Assign/Unassign buttons
> - React app at `/utilization` renders the utilization grid (matrix on desktop, list by member on mobile)

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/ProjectAssignment.cs`
> - Repository: `src/Stretto.Infrastructure/Repositories/BaseRepository.cs`
> - Service: `src/Stretto.Application/Services/ProjectService.cs`
> - Interface: `src/Stretto.Application/Interfaces/IProjectService.cs`
> - DTOs: `src/Stretto.Application/DTOs/ProjectDtos.cs`
> - Controller: `src/Stretto.Api/Controllers/ProjectsController.cs`
> - Frontend tab: `src/Stretto.Web/src/components/ProjectEventsTab.tsx`
> - Frontend page: `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`
> - DI wiring: `src/Stretto.Api/Program.cs`
> - Routing: `src/Stretto.Web/src/App.tsx`

---

### Backend

- [ ] Create `src/Stretto.Application/DTOs/ProjectAssignmentDtos.cs` with four records: `ProjectMemberDto(Guid MemberId, string FullName, string Email, bool IsAssigned)`; `AssignMemberRequest(Guid MemberId)`; `UtilizationRowDto(Guid MemberId, string FullName, int AssignedCount, int TotalProjects, List<Guid> AssignedProjectIds)`; `UtilizationGridDto(List<ProjectDto> Projects, List<UtilizationRowDto> Members)`

- [ ] Create `src/Stretto.Application/Interfaces/IProjectAssignmentService.cs` with four method signatures: `Task<List<ProjectMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId)`; `Task AssignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/ProjectAssignmentService.cs` implementing `IProjectAssignmentService` with constructor `(IRepository<ProjectAssignment> assignments, IRepository<Project> projects, IRepository<Member> members, IRepository<ProgramYear> programYears)`. `ListProjectMembersAsync`: verify project exists (throw `NotFoundException` if not); load all active org members; load existing assignments for this project; return `ProjectMemberDto` for each member with `IsAssigned` set. `AssignAsync`: verify project exists; verify member exists; if assignment already exists throw `ConflictException("Member is already assigned to this project")`; create and save new `ProjectAssignment`. `UnassignAsync`: verify project exists; find assignment by projectId+memberId+orgId (using `FindOneAsync`); if not found throw `NotFoundException("Assignment not found")`; delete it. `GetUtilizationGridAsync`: verify program year exists via `programYears.GetByIdAsync` (throw `NotFoundException` if not); load all projects for the program year; load all assignments matching those project IDs (use `ListAsync` scoped to orgId filtering by project IDs); load all active members for the org; compute per-member assigned count by counting how many of the program year's projects each member appears in; sort members descending by assigned count; return `UtilizationGridDto`

- [ ] Add assignment sub-resource actions to `src/Stretto.Api/Controllers/ProjectsController.cs`: `GET /api/projects/{id}/members` calls `_assignmentService.ListProjectMembersAsync(id, orgId)` returning 200; `POST /api/projects/{id}/members` (admin-only) reads `[FromBody] AssignMemberRequest req`, calls `_assignmentService.AssignAsync(id, req.MemberId, orgId)` returning 201 with an empty body; `DELETE /api/projects/{id}/members/{memberId}` (admin-only) calls `_assignmentService.UnassignAsync(id, memberId, orgId)` returning 204. Inject `IProjectAssignmentService` via constructor alongside existing `IProjectService`

- [ ] Add utilization action to `src/Stretto.Api/Controllers/ProgramYearsController.cs`: `GET /api/program-years/{id}/utilization` calls `_assignmentService.GetUtilizationGridAsync(id, orgId)` and returns 200. Inject `IProjectAssignmentService` via constructor

- [ ] Register `IProjectAssignmentService` → `ProjectAssignmentService` as scoped in `src/Stretto.Api/Program.cs`

---

### TypeScript Client

- [ ] Regenerate the TypeScript API client by running `npm run generate` inside `src/Stretto.Web`. Verify the output in `src/Stretto.Web/src/api/generated/` contains new `ProjectAssignmentsService` (or similar) entries for the three new endpoints and that all previously existing service files (`AuditionDatesService`, `AuditionSlotsService`, `AttendanceService`, `EventsService`, `MembersService`, `ProgramYearsService`, `ProjectsService`, `PublicAuditionsService`, `VenuesService`, `AuthService`) are still present and unmodified. If `npm run generate` drops any existing file, do NOT commit; instead manually write only the new generated types/service files needed for assignments and utilization

---

### Frontend

- [ ] Create `src/Stretto.Web/src/components/ProjectMembersTab.tsx`. Props: `{ projectId: string }`. Use `useQuery` to fetch `GET /api/projects/{projectId}/members` via the generated client (e.g. `ProjectsService.getApiProjectsMembers(projectId)`). Use `useMutation` for assign and unassign via the generated client — `onError` must display an inline error message; `onSuccess` must call `queryClient.invalidateQueries(['projectMembers', projectId])`. Show a text `<input>` with `data-testid="member-search-input"` that filters the displayed list by name or email. For each member row show the member's full name, email, an "Assign" button (`data-testid="assign-{memberId}"`) when `isAssigned === false`, and an "Unassign" button (`data-testid="unassign-{memberId}"`) when `isAssigned === true`. Buttons are disabled while a mutation is pending. Show a skeleton loader while data loads and an empty state when the list is empty

- [ ] Update `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`: replace the `{activeTab === 'members' && <p className="text-muted-foreground">Coming soon</p>}` block with `{activeTab === 'members' && <ProjectMembersTab projectId={id!} />}` and add the import

- [ ] Create `src/Stretto.Web/src/pages/UtilizationGridPage.tsx`. Use `useQuery` to load the list of program years (`ProgramYearsService`). Use a `<select>` (`data-testid="program-year-select"`) to pick which program year to view. Use a second `useQuery` keyed on the selected program year ID to fetch `GET /api/program-years/{id}/utilization` via the generated client. **Desktop layout** (`md:block hidden`): render a full `<table>` where each row is a member, each column after the first two is a project, and a cell is filled with `bg-indigo-600` when `assignedProjectIds` contains that project's ID or left as `bg-muted` when not; first column = member full name, second column = `{assignedCount}/{totalProjects}` utilization count; column headers = project names (truncated to 20 chars with `title` tooltip). **Mobile layout** (`md:hidden block`): render a list grouped by member — each item shows member name, utilization fraction, and a comma-separated list of assigned project names. Show a skeleton loader while loading. Show a friendly empty state when no program year is selected or no data exists

- [ ] Update `src/Stretto.Web/src/App.tsx`: replace the `<Route path="/utilization" element={<ComingSoon />} />` line with `<Route path="/utilization" element={<UtilizationGridPage />} />` and add the import
