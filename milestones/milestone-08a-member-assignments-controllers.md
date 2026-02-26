## Milestone: Member Assignments — Controllers

> **Validates:**
> - `POST /api/projects/{projectId}/assignments/{memberId}` returns 200 when called by an Admin session
> - `DELETE /api/projects/{projectId}/assignments/{memberId}` returns 204 when member is assigned
> - `GET /api/projects/{projectId}/assignments` returns 200 with a JSON array of members with `isAssigned` field
> - `GET /api/utilization?programYearId={id}` returns 200 with a JSON body containing `projects` and `rows` arrays

> **Reference files:**
> - Controller: `src/Stretto.Api/Controllers/ProjectsController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

---

- [ ] Register `IAssignmentService` → `AssignmentService` in `src/Stretto.Api/Program.cs` with `builder.Services.AddScoped<IAssignmentService, AssignmentService>()`

- [ ] Create `src/Stretto.Api/Controllers/AssignmentsController.cs` extending `ProtectedControllerBase` — add `POST /api/projects/{projectId}/assignments/{memberId}` (Admin only; delegate to `AssignAsync`; return 200 Ok) and `DELETE /api/projects/{projectId}/assignments/{memberId}` (Admin only; delegate to `UnassignAsync`; return 204 NoContent); fix finding #188: if `AssignAsync` or `UnassignAsync` throws, the global exception handler returns a structured error body — do not swallow errors in the controller

- [ ] Add `GET /api/projects/{projectId}/assignments` to `AssignmentsController` — no role restriction; call `ListProjectMembersAsync`; return 200 with list

- [ ] Add `GET /api/utilization` to `AssignmentsController` — Admin only; read `programYearId` from query string (return 400 if missing); call `GetUtilizationGridAsync`; return 200 with `UtilizationGridDto`
