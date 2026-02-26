## Milestone: Member Assignments – Backend

> **Validates:**
> - `POST /api/projects/{projectId}/members` with body `{"memberId":"<guid>"}` returns 201 when the member is not yet assigned
> - `DELETE /api/projects/{projectId}/members/{memberId}` returns 204 when the assignment exists
> - `GET /api/projects/{projectId}/members` returns 200 with a JSON array of members (each with `memberId`, `fullName`, `email`, `isAssigned`)
> - `GET /api/program-years/{programYearId}/utilization` returns 200 with `{ projects: [...], members: [...] }` where each member has `assignedCount`, `totalProjects`, `assignedProjectIds`
> - `GET /api/projects/{projectId}/members` for a non-existent projectId returns 404
> - `GET /api/program-years/{programYearId}/utilization` for a non-existent programYearId returns 404

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/ProjectAssignment.cs`
> - Repository: `src/Stretto.Infrastructure/Repositories/BaseRepository.cs`
> - Service: `src/Stretto.Application/Services/ProjectService.cs`
> - Interface: `src/Stretto.Application/Interfaces/IProjectService.cs`
> - DTOs: `src/Stretto.Application/DTOs/ProjectDtos.cs`
> - Controller: `src/Stretto.Api/Controllers/ProjectsController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

---

### Backend

- [x] Create `src/Stretto.Application/DTOs/ProjectAssignmentDtos.cs` with four records: `ProjectMemberDto(Guid MemberId, string FullName, string Email, bool IsAssigned)`; `AssignMemberRequest(Guid MemberId)`; `UtilizationRowDto(Guid MemberId, string FullName, int AssignedCount, int TotalProjects, List<Guid> AssignedProjectIds)`; `UtilizationGridDto(List<ProjectDto> Projects, List<UtilizationRowDto> Members)`

- [x] Create `src/Stretto.Application/Interfaces/IProjectAssignmentService.cs` with four method signatures: `Task<List<ProjectMemberDto>> ListProjectMembersAsync(Guid projectId, Guid orgId)`; `Task AssignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task UnassignAsync(Guid projectId, Guid memberId, Guid orgId)`; `Task<UtilizationGridDto> GetUtilizationGridAsync(Guid programYearId, Guid orgId)`

- [x] Create `src/Stretto.Application/Services/ProjectAssignmentService.cs` implementing `IProjectAssignmentService` with constructor `(IRepository<ProjectAssignment> assignments, IRepository<Project> projects, IRepository<Member> members, IRepository<ProgramYear> programYears)`. `ListProjectMembersAsync`: verify project exists (throw `NotFoundException` if not); load all active org members; load existing assignments for this project; return `ProjectMemberDto` for each member with `IsAssigned` set. `AssignAsync`: verify project exists; verify member exists; if assignment already exists throw `ConflictException("Member is already assigned to this project")`; create and save new `ProjectAssignment`. `UnassignAsync`: verify project exists; find assignment by projectId+memberId+orgId (using `FindOneAsync`); if not found throw `NotFoundException("Assignment not found")`; delete it. `GetUtilizationGridAsync`: verify program year exists via `programYears.GetByIdAsync` (throw `NotFoundException` if not); load all projects for the program year; load all assignments matching those project IDs (use `ListAsync` scoped to orgId filtering by project IDs); load all active members for the org; compute per-member assigned count by counting how many of the program year's projects each member appears in; sort members descending by assigned count; return `UtilizationGridDto`

- [x] Add assignment sub-resource actions to `src/Stretto.Api/Controllers/ProjectsController.cs`: `GET /api/projects/{id}/members` calls `_assignmentService.ListProjectMembersAsync(id, orgId)` returning 200; `POST /api/projects/{id}/members` (admin-only) reads `[FromBody] AssignMemberRequest req`, calls `_assignmentService.AssignAsync(id, req.MemberId, orgId)` returning 201 with an empty body; `DELETE /api/projects/{id}/members/{memberId}` (admin-only) calls `_assignmentService.UnassignAsync(id, memberId, orgId)` returning 204. Inject `IProjectAssignmentService` via constructor alongside existing `IProjectService`

- [ ] Add utilization action to `src/Stretto.Api/Controllers/ProgramYearsController.cs`: `GET /api/program-years/{id}/utilization` calls `_assignmentService.GetUtilizationGridAsync(id, orgId)` and returns 200. Inject `IProjectAssignmentService` via constructor

- [ ] Register `IProjectAssignmentService` → `ProjectAssignmentService` as scoped in `src/Stretto.Api/Program.cs`
