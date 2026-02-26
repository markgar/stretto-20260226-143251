## Milestone: Member Assignments — Backend

> **Validates:**
> - `POST /api/projects/{projectId}/assignments/{memberId}` returns 200 when called by an Admin session
> - `DELETE /api/projects/{projectId}/assignments/{memberId}` returns 204 when member is assigned
> - `GET /api/projects/{projectId}/assignments` returns 200 with a JSON array of members with `isAssigned` field
> - `GET /api/utilization?programYearId={id}` returns 200 with a JSON body containing `projects` and `rows` arrays

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/ProjectAssignment.cs`
> - DTOs: `src/Stretto.Application/DTOs/ProjectDtos.cs`
> - Interface: `src/Stretto.Application/Interfaces/IProjectService.cs`
> - Service: `src/Stretto.Application/Services/ProjectService.cs`
> - Controller: `src/Stretto.Api/Controllers/ProjectsController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

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
