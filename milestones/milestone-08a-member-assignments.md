## Milestone: Member Assignments

> **Validates:**
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to obtain a program year id; then `GET /api/projects?programYearId={id}` to obtain a project id and a member id via `GET /api/members`
> - `GET /api/projects/{id}/members` returns HTTP 200 with an empty JSON array before any assignment
> - `POST /api/projects/{id}/members/{memberId}` (Admin) returns HTTP 201 with JSON body containing `assignmentId`, `memberId`, `firstName`, `lastName`
> - `GET /api/projects/{id}/members` returns HTTP 200 with a JSON array containing the newly assigned member
> - `POST /api/projects/{id}/members/{memberId}` a second time (same member) returns HTTP 422
> - `DELETE /api/projects/{id}/members/{memberId}` returns HTTP 204; subsequent `GET /api/projects/{id}/members` returns empty array
> - Browser navigates to `/projects` and the project list page renders (not "Coming soon")
> - Browser navigates to `/projects/{id}` and the project detail page renders with a Members tab that shows a member list with assign/unassign buttons

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProjectAssignment.cs` — ProjectAssignment entity (Id, ProjectId, MemberId, OrganizationId)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic repo; `ListAsync(orgId, predicate)` for filtered queries
> - `src/Stretto.Application/Services/MemberService.cs` — pattern for service: constructor-inject multiple `IRepository<T>`, throw typed exceptions, return DTO records, private `ToDto` helper
> - `src/Stretto.Api/Controllers/ProtectedControllerBase.cs` — abstract base with `GetSessionAsync()` helper; all new controllers MUST extend this
> - `src/Stretto.Api/Controllers/ProjectsController.cs` — thin controller pattern; extend `ProtectedControllerBase` instead of duplicating `GetSessionAsync`
> - `src/Stretto.Api/Program.cs` — register new services with `builder.Services.AddScoped<IXxxService, XxxService>()`
> - `src/Stretto.Web/src/App.tsx` — route definitions; replace `ComingSoon` placeholders with real page components
> - `src/Stretto.Web/src/pages/MembersListPage.tsx` — frontend pattern: `useQuery` with raw `fetch(..., { credentials: 'include' })`, Tailwind + shadcn/ui, `data-testid` on interactive elements

- [ ] Add `ProjectMemberDto(Guid AssignmentId, Guid MemberId, string FirstName, string LastName, string Email)` record to `src/Stretto.Application/DTOs/ProjectDtos.cs`

- [ ] Create `src/Stretto.Application/Interfaces/IProjectAssignmentService.cs` with three method signatures: `Task<List<ProjectMemberDto>> ListByProjectAsync(Guid projectId, Guid orgId)`; `Task<ProjectMemberDto> AssignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/ProjectAssignmentService.cs` implementing `IProjectAssignmentService`; constructor-inject `IRepository<ProjectAssignment>`, `IRepository<Member>`, `IRepository<Project>`; `ListByProjectAsync` calls `_assignments.ListAsync(orgId, a => a.ProjectId == projectId)`, fetches each member via `_members.GetByIdAsync`, maps to `ProjectMemberDto`; `AssignAsync` fetches project (throw `NotFoundException("Project not found")` if null), fetches member (throw `NotFoundException("Member not found")` if null), checks for existing assignment via `_assignments.FindOneAsync(a => a.ProjectId == projectId && a.MemberId == memberId && a.OrganizationId == orgId)` (throw `ValidationException(new Dictionary<string,string[]>{["member"]=["Member is already assigned to this project"]})` if found), creates and saves `ProjectAssignment`; `UnassignAsync` finds assignment (throw `NotFoundException("Assignment not found")` if null) then calls `_assignments.DeleteAsync`

- [ ] Register `IProjectAssignmentService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IProjectAssignmentService, ProjectAssignmentService>();` after the existing service registrations; add necessary `using` directives

- [ ] Refactor `src/Stretto.Api/Controllers/ProjectsController.cs` to extend `ProtectedControllerBase` instead of `ControllerBase`; remove the duplicated `GetSessionAsync()` method body; update the constructor to call `base(authService)`; the controller's public methods remain unchanged

- [ ] Refactor `src/Stretto.Api/Controllers/VenuesController.cs` to extend `ProtectedControllerBase` instead of `ControllerBase`; remove the duplicated `GetSessionAsync()` method body; update the constructor to call `base(authService)`; the controller's public methods remain unchanged

- [ ] Add assignment endpoints to `src/Stretto.Api/Controllers/ProjectsController.cs`: inject `IProjectAssignmentService` in the constructor; add `GET /api/projects/{id}/members` → calls `ListByProjectAsync`, returns `Ok(list)` (any authenticated role); add `POST /api/projects/{id}/members/{memberId}` → requires Admin role (throw `ForbiddenException` otherwise), calls `AssignAsync`, returns `Created($"/api/projects/{id}/members/{memberId}", dto)`; add `DELETE /api/projects/{id}/members/{memberId}` → requires Admin role, calls `UnassignAsync`, returns `NoContent()`

- [ ] Create `src/Stretto.Web/src/pages/ProjectsListPage.tsx`; `useQuery` to fetch `/api/projects?programYearId={programYearId}` with `credentials: 'include'`; if no `programYearId` param, show a program-year selector dropdown (fetch from `/api/program-years`); render a list of project cards showing `name`, `startDate`, `endDate` with a link to `/projects/{id}`; `data-testid="projects-heading"` on the page heading; `data-testid="project-item"` on each project card

- [ ] Create `src/Stretto.Web/src/pages/ProjectDetailPage.tsx` with tab navigation (Overview, Members); Overview tab shows project name, program year, start/end dates; Members tab renders `ProjectMembersTab` component (imported from same directory); use `useParams` to get project id; `data-testid="project-detail-heading"` on the project name heading; `data-testid="tab-overview"` and `data-testid="tab-members"` on the tab buttons

- [ ] Create `src/Stretto.Web/src/pages/ProjectMembersTab.tsx`; props: `projectId: string`; section 1 "Assigned Members" — `useQuery` to fetch `/api/projects/{projectId}/members`, renders list with `data-testid="assigned-member-item"` and an Unassign button (`data-testid="unassign-button-{memberId}"`) that calls `DELETE /api/projects/{projectId}/members/{memberId}` via `useMutation`, then invalidates query; section 2 "Add Member" — search input (`data-testid="member-search-input"`) with `useQuery` to fetch `/api/members?search={q}` filtered to exclude already-assigned members; each result row has an Assign button (`data-testid="assign-button-{memberId}"`) that calls `POST /api/projects/{projectId}/members/{memberId}` via `useMutation`, then invalidates both queries

- [ ] Update `src/Stretto.Web/src/App.tsx`: add imports for `ProjectsListPage` and `ProjectDetailPage`; replace the `<Route path="/projects" element={<ComingSoon />} />` with `<Route path="/projects" element={<ProjectsListPage />} />`; add `<Route path="/projects/:id" element={<ProjectDetailPage />} />`
