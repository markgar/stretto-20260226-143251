## Milestone: Utilization Grid

> **Validates:**
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to obtain a program year id
> - `GET /api/utilization?programYearId={id}` (Admin) returns HTTP 200 with JSON body containing `projects` array and `rows` array; each row has `memberId`, `displayName`, `assignedProjectIds`, `assignmentCount`, `utilizationPct`; rows are sorted by `assignmentCount` descending
> - `GET /api/utilization?programYearId={id}` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403
> - Browser navigates to `/utilization` and the Utilization Grid page renders with a table of members × projects

> **Reference files:**
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic repo; `ListAsync(orgId, predicate)` for filtered queries
> - `src/Stretto.Application/Services/MemberService.cs` — pattern for service: constructor-inject multiple `IRepository<T>`, throw typed exceptions, return DTO records, private `ToDto` helper
> - `src/Stretto.Api/Controllers/ProtectedControllerBase.cs` — abstract base with `GetSessionAsync()` helper; all new controllers MUST extend this
> - `src/Stretto.Api/Program.cs` — register new services with `builder.Services.AddScoped<IXxxService, XxxService>()`
> - `src/Stretto.Web/src/App.tsx` — route definitions; replace `ComingSoon` placeholders with real page components
> - `src/Stretto.Web/src/pages/MembersListPage.tsx` — frontend pattern: `useQuery` with raw `fetch(..., { credentials: 'include' })`, Tailwind + shadcn/ui, `data-testid` on interactive elements

- [ ] Create `src/Stretto.Application/DTOs/UtilizationDtos.cs` with three records: `UtilizationProjectDto(Guid Id, string Name)`; `UtilizationRowDto(Guid MemberId, string DisplayName, List<Guid> AssignedProjectIds, int AssignmentCount, double UtilizationPct)`; `UtilizationGridDto(List<UtilizationProjectDto> Projects, List<UtilizationRowDto> Rows)`

- [ ] Create `src/Stretto.Application/Interfaces/IUtilizationService.cs` with one method signature: `Task<UtilizationGridDto> GetGridAsync(Guid programYearId, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/UtilizationService.cs` implementing `IUtilizationService`; constructor-inject `IRepository<Project>`, `IRepository<ProjectAssignment>`, `IRepository<Member>`; `GetGridAsync` fetches all projects with `_projects.ListAsync(orgId, p => p.ProgramYearId == programYearId)`, all active members with `_members.ListAsync(orgId, m => m.IsActive)`, all assignments for those projects with `_assignments.ListAsync(orgId, a => projects.Select(p => p.Id).Contains(a.ProjectId))`; builds rows where each row's `AssignedProjectIds` is the set of project ids that member has an assignment for; sorts rows by `AssignmentCount` descending; sets `UtilizationPct` to `AssignmentCount / (double)projects.Count * 100` (0.0 when projects is empty)

- [ ] Register `IUtilizationService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IUtilizationService, UtilizationService>();` after the existing service registrations; add necessary `using` directives

- [ ] Create `src/Stretto.Api/Controllers/UtilizationController.cs` extending `ProtectedControllerBase` with `[ApiController]`, `[Route("api/utilization")]`; constructor-inject `IUtilizationService` and `IAuthService`; implement `GET /api/utilization?programYearId={id}` → requires Admin role (throw `ForbiddenException` otherwise), return 400 if `programYearId` is null, calls `_utilizationService.GetGridAsync(programYearId.Value, orgId)`, returns `Ok(dto)`

- [ ] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so the new `/api/utilization` endpoint appears in `src/Stretto.Web/src/api/generated/`

- [ ] Create `src/Stretto.Web/src/pages/UtilizationGridPage.tsx`; `useQuery` to fetch `/api/program-years` then allow selecting a program year; when a program year is selected fetch `/api/utilization?programYearId={id}`; on desktop (md breakpoint and above): render a sticky-header `<table>` with a "Member" column, one column per project (project name as header), a "Count" column, and a "%" column; cells where the member is assigned to that project render with `bg-accent` background and a checkmark; on mobile (below md): render a list of member rows each showing the member display name, assignment count, utilization percentage, and a row of colored badges for each assigned project name; add `data-testid="utilization-grid"` on the table and `data-testid="utilization-list"` on the mobile list container

- [ ] Update `src/Stretto.Web/src/App.tsx`: add import for `UtilizationGridPage`; replace `<Route path="/utilization" element={<ComingSoon />} />` with `<Route path="/utilization" element={<UtilizationGridPage />} />`
