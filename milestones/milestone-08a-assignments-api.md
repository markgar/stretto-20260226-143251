## Milestone: Member Assignments + Utilization Grid — API

> **Validates:**
> - `POST /api/auth/login` with body `{"email":"mgarner22@gmail.com"}` returns HTTP 200 with a session cookie
> - `GET /api/projects/{projectId}/members` authenticated as admin returns HTTP 200 with a JSON array (empty initially)
> - `POST /api/projects/{projectId}/members/{memberId}` authenticated as admin returns HTTP 200 with a JSON body containing `id`, `firstName`, `lastName`, `email`, `role`
> - `GET /api/projects/{projectId}/members` after assignment returns HTTP 200 with one entry matching the assigned member
> - `POST /api/projects/{projectId}/members/{memberId}` a second time (duplicate) returns HTTP 400
> - `DELETE /api/projects/{projectId}/members/{memberId}` authenticated as admin returns HTTP 204
> - `GET /api/projects/{projectId}/members` after unassignment returns HTTP 200 with empty array
> - `POST /api/projects/{projectId}/members/{memberId}` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403
> - `GET /api/utilization?programYearId={programYearId}` authenticated as admin returns HTTP 200 with JSON object containing `projects` (array of objects with `projectId`, `name`) and `members` (array of objects with `memberId`, `name`, `assignmentCount`, `totalProjects`, `utilizationPct`, `assigned` boolean array); rows sorted descending by `assignmentCount`
> - `GET /api/health` returns HTTP 200

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProjectAssignment.cs` — existing entity (Id, ProjectId, MemberId, OrganizationId)
> - `src/Stretto.Infrastructure/Data/Configurations/ProjectAssignmentConfiguration.cs` — Fluent API config pattern; no changes needed
> - `src/Stretto.Application/Services/MemberService.cs` — pattern for service using `IRepository<ProjectAssignment>` with `ListAsync(orgId, predicate)` filter; constructor-inject multiple repositories
> - `src/Stretto.Api/Controllers/ProjectsController.cs` — thin controller pattern; `GetSessionAsync()` helper; role-gating with `ForbiddenException`
> - `src/Stretto.Api/Program.cs` — DI registration; add `builder.Services.AddScoped<IProjectAssignmentService, ProjectAssignmentService>();`

- [ ] Add `ProjectAssignmentDtos.cs` in `src/Stretto.Application/DTOs/` with four records: `AssignedMemberDto(Guid Id, string FirstName, string LastName, string Email, string Role)`; `UtilizationProjectColumn(Guid ProjectId, string Name)`; `UtilizationMemberRow(Guid MemberId, string Name, int AssignmentCount, int TotalProjects, double UtilizationPct, List<bool> Assigned)`; `UtilizationGridDto(List<UtilizationProjectColumn> Projects, List<UtilizationMemberRow> Members)`

- [ ] Create `src/Stretto.Application/Interfaces/IProjectAssignmentService.cs` with four method signatures: `Task<List<AssignedMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId)`; `Task<AssignedMemberDto> AssignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/ProjectAssignmentService.cs` implementing `IProjectAssignmentService`; constructor-inject `IRepository<ProjectAssignment>`, `IRepository<Project>`, `IRepository<Member>`, `IRepository<ProgramYear>`; `ListProjectMembersAsync` calls `_assignments.ListAsync(orgId, a => a.ProjectId == projectId)` then fetches each member with `_members.GetByIdAsync`; `AssignAsync` verifies project exists (throw `NotFoundException("Project not found")` if null), verifies member exists (throw `NotFoundException("Member not found")` if null), checks for duplicate via `_assignments.ListAsync(orgId, a => a.ProjectId == projectId && a.MemberId == memberId)` (throw `ValidationException(new Dictionary<string,string[]>{["memberId"]=["Member is already assigned"]})` if non-empty), creates `new ProjectAssignment { Id = Guid.NewGuid(), ProjectId = projectId, MemberId = memberId, OrganizationId = orgId }` and calls `AddAsync`; `UnassignAsync` finds assignment via `ListAsync(orgId, a => a.ProjectId == projectId && a.MemberId == memberId)`, throws `NotFoundException("Assignment not found")` if empty, then calls `DeleteAsync`; `GetUtilizationGridAsync` fetches all projects in the program year via `_projects.ListAsync(orgId, p => p.ProgramYearId == programYearId)`, fetches all members via `_members.ListAsync(orgId)`, fetches all assignments via `_assignments.ListAsync(orgId)`, builds `UtilizationProjectColumn` list from projects, builds `UtilizationMemberRow` for each member with `assignmentCount` = count of assignments intersecting the project set, `totalProjects` = projects.Count, `utilizationPct` = totalProjects > 0 ? (double)assignmentCount / totalProjects * 100 : 0, `assigned` = bool list one entry per project indicating whether that member has an assignment for that project; orders rows descending by `assignmentCount`

- [ ] Register `IProjectAssignmentService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IProjectAssignmentService, ProjectAssignmentService>();` after the existing `IProjectService` registration; add `using Stretto.Application.Interfaces;` and `using Stretto.Application.Services;` if not already present

- [ ] Create `src/Stretto.Api/Controllers/ProjectAssignmentsController.cs` with `[ApiController]`, `[Route("api/projects")]`; constructor-inject `IProjectAssignmentService` and `IAuthService`; add private `GetSessionAsync()` helper (same pattern as `ProjectsController`); implement four actions: `GET /api/projects/{projectId}/members` → calls `GetSessionAsync()`, calls `ListProjectMembersAsync(projectId, orgId)`, returns `Ok(list)`; `POST /api/projects/{projectId}/members/{memberId}` → requires Admin role (throw `ForbiddenException` otherwise), calls `AssignAsync(projectId, memberId, orgId)`, returns `Ok(dto)`; `DELETE /api/projects/{projectId}/members/{memberId}` → requires Admin role, calls `UnassignAsync(projectId, memberId, orgId)`, returns `NoContent()`; `GET /api/utilization` with `[FromQuery] Guid? programYearId` → calls `GetSessionAsync()`, returns 400 if `programYearId` is null, calls `GetUtilizationGridAsync(programYearId.Value, orgId)`, returns `Ok(grid)`; annotate this action with `[Route("/api/utilization")]` to override the controller route prefix

- [ ] Fix bug #122: in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`, change the `ValidationException` handler to return HTTP 400 (not 422), per SPEC requirement that validation errors return 400

- [ ] Fix bug #159: in `src/Stretto.Application/Services/ProjectService.cs` `ValidateDates`, split the boundary check into two separate throws — one for `startDate < programYear.StartDate` keyed on `"startDate"` and one for `endDate > programYear.EndDate` keyed on `"endDate"` — so field-level errors reference the actual invalid field

- [ ] Regenerate the TypeScript API client: run `cd src/Stretto.Web && npm run generate` so the new assignment and utilization endpoints appear in `src/Stretto.Web/src/api/generated/`
