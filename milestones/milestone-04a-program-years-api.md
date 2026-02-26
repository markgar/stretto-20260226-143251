## Milestone: Program Years — API

> **Validates:**
> - `GET /api/program-years` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `{"email":"mgarner22@gmail.com"}` then `GET /api/program-years` returns HTTP 200 with a JSON array
> - `POST /api/program-years` with `{"name":"2025–2026","startDate":"2025-09-01","endDate":"2026-06-30"}` returns HTTP 201 with an `id` field
> - `GET /api/program-years/{id}` returns HTTP 200 with matching `name`, `isCurrent: false`, `isArchived: false`
> - `PUT /api/program-years/{id}` with updated name returns HTTP 200 with updated `name`
> - `POST /api/program-years/{id}/archive` returns HTTP 200 with `isArchived: true` and `isCurrent: false`
> - `POST /api/program-years/{id}/activate` on a non-archived year returns HTTP 200 with `isCurrent: true`; a second `POST /api/program-years/{other-id}/activate` sets the first year's `isCurrent` to `false`

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProgramYear.cs` — entity already defined (Id, Name, StartDate, EndDate, IsCurrent, IsArchived, OrganizationId)
> - `src/Stretto.Application/DTOs/AuthDtos.cs` — pattern for record DTOs
> - `src/Stretto.Application/Services/AuthService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTOs
> - `src/Stretto.Api/Controllers/AuthController.cs` — thin controller pattern; cookie reading; `GetOrgIdAsync()` helper pattern used in VenuesController
> - `src/Stretto.Api/Program.cs` — add `AddScoped<ProgramYearService>()` here

- [x] Fix `AuthController.Login` in `src/Stretto.Api/Controllers/AuthController.cs`: add `Expires = DateTimeOffset.UtcNow.AddHours(8)` to the `CookieOptions` passed to `Response.Cookies.Append` so the session cookie persists across browser restarts (fixes finding #61)

- [x] Create `src/Stretto.Application/DTOs/ProgramYearDtos.cs` with records: `ProgramYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsArchived)`, `CreateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`, `UpdateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`

- [x] Create `src/Stretto.Application/Services/ProgramYearService.cs`; constructor-inject `IRepository<ProgramYear>`; implement `ListAsync(Guid orgId)` calling `_programYears.ListAsync(orgId)` and returning `List<ProgramYearDto>` ordered by StartDate descending; implement `GetAsync(Guid id, Guid orgId)` throwing `NotFoundException("Program year not found")` if null and returning `ProgramYearDto`; implement `CreateAsync(Guid orgId, CreateProgramYearRequest req)` that validates `req.StartDate < req.EndDate` (throw `ValidationException(new Dictionary<string,string>{ ["startDate"] = "Start date must be before end date" })` if not), creates `new ProgramYear { Id = Guid.NewGuid(), Name = req.Name, StartDate = req.StartDate, EndDate = req.EndDate, IsCurrent = false, IsArchived = false, OrganizationId = orgId }`, calls `AddAsync`, returns `ProgramYearDto`

- [ ] Add `UpdateAsync(Guid id, Guid orgId, UpdateProgramYearRequest req)` to `ProgramYearService`: load via `GetAsync` (propagates `NotFoundException`), validate `req.StartDate < req.EndDate` (throw `ValidationException` same as create), update `Name`, `StartDate`, `EndDate` on the entity, call `_programYears.UpdateAsync(entity)`, return `ProgramYearDto`

- [ ] Add `ArchiveAsync(Guid id, Guid orgId)` and `MarkCurrentAsync(Guid id, Guid orgId)` to `ProgramYearService`: `ArchiveAsync` loads entity (throws `NotFoundException` if not found), sets `IsArchived = true` and `IsCurrent = false`, calls `UpdateAsync`, returns `ProgramYearDto`; `MarkCurrentAsync` loads entity (throws `NotFoundException` if not found), throws `ValidationException(new Dictionary<string,string>{ [""] = "Cannot activate an archived program year" })` if `entity.IsArchived`, sets `entity.IsCurrent = true`, calls `UpdateAsync`, then loads all program years via `_programYears.ListAsync(orgId)` and for each where `py.Id != id && py.IsCurrent`, sets `IsCurrent = false` and calls `UpdateAsync`; returns `ProgramYearDto` for the activated year

- [ ] Register `ProgramYearService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<ProgramYearService>();` after the existing `AddScoped<AuthService>()` line (add `using Stretto.Application.Services;` if not already present)

- [ ] Create `src/Stretto.Api/Controllers/ProgramYearsController.cs` with `[ApiController]`, `[Route("api/program-years")]`; constructor-inject `ProgramYearService _programYears` and `AuthService _authService`; add private async helper `GetOrgIdAsync()` that reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException()` if null, calls `_authService.ValidateAsync(token)`, returns `dto.OrgId`; implement six action methods: `[HttpGet] GET /api/program-years` → `Ok(await _programYears.ListAsync(orgId))`; `[HttpPost] POST /api/program-years` → `Created($"/api/program-years/{dto.Id}", dto)`; `[HttpGet("{id}")] GET /api/program-years/{id}` → `Ok(dto)`; `[HttpPut("{id}")] PUT /api/program-years/{id}` → `Ok(dto)`; `[HttpPost("{id}/archive")] POST /api/program-years/{id}/archive` → `Ok(dto)`; `[HttpPost("{id}/activate")] POST /api/program-years/{id}/activate` → `Ok(dto)`
