## Milestone: Projects — CRUD API

> **Validates:**
> - `GET /api/projects?programYearId={id}` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to obtain a program year id; then `POST /api/projects` with body `{"programYearId":"<id>","name":"Spring Concert","startDate":"<py.startDate>","endDate":"<py.endDate>"}` (dates within the program year range) returns HTTP 201 with JSON body containing `id`, `name`, `programYearId`, `startDate`, `endDate`
> - `GET /api/projects?programYearId=<id>` returns HTTP 200 with a JSON array containing the created project
> - `GET /api/projects/{id}` with the created project id returns HTTP 200 with matching `name`
> - `PUT /api/projects/{id}` with body `{"name":"Spring Gala","startDate":"<same>","endDate":"<same>"}` returns HTTP 200 with updated `name`
> - `POST /api/projects` with `startDate` equal to or after `endDate` returns HTTP 422
> - `DELETE /api/projects/{id}` returns HTTP 204; subsequent `GET /api/projects/{id}` returns HTTP 404
> - `POST /api/projects` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/Project.cs` — Project entity (already defined; Id, Name, ProgramYearId, StartDate, EndDate, OrganizationId)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic base repository; `ListAsync(orgId, predicate)` supports a where-clause for filtering by ProgramYearId
> - `src/Stretto.Application/Services/VenueService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTO records
> - `src/Stretto.Api/Controllers/VenuesController.cs` — pattern for thin controller: read session cookie via `GetSessionAsync()`, delegate to service, return HTTP result
> - `src/Stretto.Api/Program.cs` — register the new service with `builder.Services.AddScoped<IProjectService, ProjectService>()`

- [x] Create `src/Stretto.Application/DTOs/ProjectDtos.cs` with three records: `ProjectDto(Guid Id, string Name, Guid ProgramYearId, DateOnly StartDate, DateOnly EndDate)`; `CreateProjectRequest(Guid ProgramYearId, string Name, DateOnly StartDate, DateOnly EndDate)`; `UpdateProjectRequest(string Name, DateOnly StartDate, DateOnly EndDate)`

- [x] Create `src/Stretto.Application/Interfaces/IProjectService.cs` with five method signatures: `Task<List<ProjectDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)`; `Task<ProjectDto> GetAsync(Guid id, Guid orgId)`; `Task<ProjectDto> CreateAsync(Guid orgId, CreateProjectRequest req)`; `Task<ProjectDto> UpdateAsync(Guid id, Guid orgId, UpdateProjectRequest req)`; `Task DeleteAsync(Guid id, Guid orgId)`

- [x] Create `src/Stretto.Application/Services/ProjectService.cs` implementing `IProjectService`; constructor-inject `IRepository<Project>` and `IRepository<ProgramYear>`; `ListByProgramYearAsync` calls `_projects.ListAsync(orgId, p => p.ProgramYearId == programYearId)` and maps to `ProjectDto`; `GetAsync` calls `GetByIdAsync(id, orgId)`, throws `NotFoundException("Project not found")` if null; `CreateAsync` fetches the program year with `_programYears.GetByIdAsync(req.ProgramYearId, orgId)` (throw `NotFoundException("Program year not found")` if null), throws `ValidationException(new Dictionary<string,string[]>{["startDate"]=["Start date must be before end date"]})` if `req.StartDate >= req.EndDate`, throws `ValidationException(new Dictionary<string,string[]>{["startDate"]=["Project dates must fall within the program year"]})` if project dates fall outside the program year's StartDate–EndDate range, then creates the entity and calls `AddAsync`; `UpdateAsync` performs the same date validations (re-fetch program year from the existing project's `ProgramYearId`); `DeleteAsync` fetches by id/orgId (throw `NotFoundException` if null) then calls `DeleteAsync`; include private `ToDto(Project p)` helper

- [ ] Register `IProjectService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IProjectService, ProjectService>();` after the existing `AddScoped<VenueService>()` line; add `using Stretto.Application.Interfaces;` and `using Stretto.Application.Services;` if not already present

- [ ] Create `src/Stretto.Api/Controllers/ProjectsController.cs` with `[ApiController]`, `[Route("api/projects")]`; constructor-inject `IProjectService` and `IAuthService`; add private `GetSessionAsync()` helper (identical pattern to `VenuesController`); implement: `GET /api/projects?programYearId={id}` → calls `GetSessionAsync()`, requires `programYearId` query param (return 400 if missing), calls `ListByProgramYearAsync`, returns `Ok(list)`; `GET /api/projects/{id}` → returns `Ok(dto)`; `POST /api/projects` → requires Admin role (throw `ForbiddenException` otherwise), calls `CreateAsync`, returns `Created($"/api/projects/{dto.Id}", dto)`; `PUT /api/projects/{id}` → requires Admin role, returns `Ok(dto)`; `DELETE /api/projects/{id}` → requires Admin role, returns `NoContent()`

- [ ] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so the new `/api/projects` endpoints appear in `src/Stretto.Web/src/api/generated/`
