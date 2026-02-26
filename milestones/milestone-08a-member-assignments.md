## Milestone: Member Assignments + Utilization Grid

> **Validates:**
> - `POST /api/projects/{projectId}/assignments/{memberId}` returns 200 when called by an Admin session
> - `DELETE /api/projects/{projectId}/assignments/{memberId}` returns 204 when member is assigned
> - `GET /api/projects/{projectId}/assignments` returns 200 with a JSON array of members with `isAssigned` field
> - `GET /api/utilization?programYearId={id}` returns 200 with a JSON body containing `projects` and `rows` arrays
> - `GET /projects/{id}` renders the project detail page; clicking the "Members" tab shows a member list with assign/unassign buttons
> - `GET /utilization` renders the Utilization Grid page (not "Coming soon")

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/ProjectAssignment.cs`
> - DTOs: `src/Stretto.Application/DTOs/ProjectDtos.cs`
> - Interface: `src/Stretto.Application/Interfaces/IProjectService.cs`
> - Service: `src/Stretto.Application/Services/ProjectService.cs`
> - Controller: `src/Stretto.Api/Controllers/ProjectsController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`
> - Tab component: `src/Stretto.Web/src/components/ProjectEventsTab.tsx`
> - Page with tabs: `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`

---

- [ ] Create `src/Stretto.Application/DTOs/AssignmentDtos.cs` with records: `ProjectMemberDto(Guid MemberId, string FirstName, string LastName, string Email, bool IsAssigned)`, `UtilizationColumnDto(Guid ProjectId, string Name)`, `UtilizationRowDto(Guid MemberId, string FirstName, string LastName, int AssignmentCount, int TotalProjects, IReadOnlyList<bool> Assigned)`, and `UtilizationGridDto(IReadOnlyList<UtilizationColumnDto> Projects, IReadOnlyList<UtilizationRowDto> Rows)`

- [ ] Create `src/Stretto.Application/Interfaces/IAssignmentService.cs` with methods: `Task AssignAsync(Guid projectId, Guid memberId, Guid orgId)`, `Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)`, `Task<List<ProjectMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId)`, `Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/AssignmentService.cs` — implement `AssignAsync`: look up project by `projectId`+`orgId` (throw `NotFoundException` if absent), look up member by `memberId`+`orgId` (throw `NotFoundException` if absent), check no existing `ProjectAssignment` with same ids (throw `ValidationException` with key `memberId` = "Member is already assigned to this project" if duplicate), then add new `ProjectAssignment`

- [ ] Add `UnassignAsync` to `AssignmentService` — find `ProjectAssignment` by `projectId`+`memberId`+`orgId`; throw `NotFoundException("Assignment not found")` if absent; delete it

- [ ] Add `ListProjectMembersAsync` to `AssignmentService` — list all active members in org, list all `ProjectAssignment` rows for the project, return each member as `ProjectMemberDto` with `IsAssigned = assignmentIds.Contains(member.Id)`

- [ ] Add `GetUtilizationGridAsync` to `AssignmentService` — validate the program year exists for the org (throw `NotFoundException` if absent); load all projects in that program year; load all org members (active); load all `ProjectAssignment` rows for those projects; build `UtilizationGridDto` with rows sorted descending by `AssignmentCount`; `TotalProjects` = total project count; `Assigned` list length equals project count, true where the member is assigned

- [ ] Register `IAssignmentService` → `AssignmentService` in `src/Stretto.Api/Program.cs` with `builder.Services.AddScoped<IAssignmentService, AssignmentService>()`

- [ ] Create `src/Stretto.Api/Controllers/AssignmentsController.cs` extending `ProtectedControllerBase` — add `POST /api/projects/{projectId}/assignments/{memberId}` (Admin only; delegate to `AssignAsync`; return 200 Ok) and `DELETE /api/projects/{projectId}/assignments/{memberId}` (Admin only; delegate to `UnassignAsync`; return 204 NoContent); fix finding #188: if `AssignAsync` or `UnassignAsync` throws, the global exception handler returns a structured error body — do not swallow errors in the controller

- [ ] Add `GET /api/projects/{projectId}/assignments` to `AssignmentsController` — no role restriction; call `ListProjectMembersAsync`; return 200 with list

- [ ] Add `GET /api/utilization` to `AssignmentsController` — Admin only; read `programYearId` from query string (return 400 if missing); call `GetUtilizationGridAsync`; return 200 with `UtilizationGridDto`

- [ ] Regenerate TypeScript API client — ensure the backend is running (or swagger.json is up to date), then run `cd src/Stretto.Web && npm run generate`; commit the updated files in `src/api/generated/`

- [ ] Create `src/Stretto.Web/src/components/ProjectMembersTab.tsx` — fetches `GET /api/projects/{projectId}/assignments` via `useQuery`; renders a search `<input data-testid="member-search" />` that filters the list client-side by name/email; for each member renders a row with full name, email, and (if Admin) a toggle button `<button data-testid="toggle-assignment-{memberId}">` that calls `POST` or `DELETE` via `useMutation` based on current `isAssigned` value; `onError` handler sets a visible error message (fixing finding #188 on the frontend side); `queryClient.invalidateQueries` on success

- [ ] Update `ProjectDetailPage.tsx` — replace `<p className="text-muted-foreground">Coming soon</p>` inside `{activeTab === 'members' && ...}` with `<ProjectMembersTab projectId={id!} />`; add the import for `ProjectMembersTab`

- [ ] Create `src/Stretto.Web/src/pages/UtilizationGridPage.tsx` — fetches program years via `useQuery` to populate a `<select data-testid="program-year-select" />`; on year selection fetches `GET /api/utilization?programYearId={id}` via `useQuery`; on desktop (`md` and above) renders a table: member rows (firstName lastName, count, percentage) × project columns with a filled accent cell (`bg-primary/20`) when assigned, plain empty cell otherwise; on mobile renders a list-by-member showing name, assignment count (e.g. "3 / 5 projects"), and percentage; loading skeleton while fetching; empty state when no program year selected or no data

- [ ] Update `App.tsx` — import `UtilizationGridPage` from `./pages/UtilizationGridPage`; replace `<ComingSoon />` at path `/utilization` with `<UtilizationGridPage />`
