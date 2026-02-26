## Milestone: Program Years – Backend

> **Validates:**
> - `GET /api/program-years` returns 200 with a JSON array (scoped to the authenticated org)
> - `POST /api/program-years` with `{ "name": "2026–27", "startDate": "2026-09-01", "endDate": "2027-06-30" }` returns 201 with the created program year
> - `GET /api/program-years/{id}` returns 200 for a valid id
> - `PUT /api/program-years/{id}` returns 200 with updated data
> - `POST /api/program-years/{id}/archive` returns 200 and the program year has `isArchived: true`
> - `POST /api/program-years/{id}/mark-current` returns 200 and only that program year has `isCurrent: true`

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProgramYear.cs` — existing entity (Id, Name, StartDate, EndDate, IsCurrent, IsArchived, OrganizationId)
> - `src/Stretto.Application/DTOs/AuthDtos.cs` — DTO record pattern to follow
> - `src/Stretto.Application/Services/AuthService.cs` — service pattern (constructor injection, typed exceptions)
> - `src/Stretto.Api/Controllers/AuthController.cs` — controller pattern (thin, [ApiController], [Route], return IActionResult)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic repository used via `IRepository<T>`
> - `src/Stretto.Api/Program.cs` — DI registration file to extend with new service
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — middleware to fix (add logging)
> - `src/Stretto.Application/Services/AuthService.cs` — contains ValidateAsync to fix (add IsActive check)

- [ ] Fix `AuthService.ValidateAsync` in `src/Stretto.Application/Services/AuthService.cs` to add `&& m.IsActive` to the `FindOneAsync` predicate so deactivated members cannot use existing sessions

- [ ] Fix `GlobalExceptionHandlerMiddleware` in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` to inject `ILogger<GlobalExceptionHandlerMiddleware>` via constructor and call `_logger.LogError(ex, "Unhandled exception")` in the catch-all block before writing the 500 response

- [ ] Create `src/Stretto.Application/DTOs/ProgramYearDtos.cs` with: `record ProgramYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsArchived)`; `record CreateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`; `record UpdateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`

- [ ] Create `src/Stretto.Application/Services/ProgramYearService.cs` with constructor `(IRepository<ProgramYear> repo)`; method `ListAsync(Guid orgId)` returns `List<ProgramYearDto>` ordered by StartDate descending; method `GetAsync(Guid id, Guid orgId)` throws `NotFoundException` if not found; method `CreateAsync(Guid orgId, CreateProgramYearRequest req)` validates StartDate < EndDate (throw `ValidationException("StartDate must be before EndDate")`) then adds entity with new `Guid.NewGuid()` Id; method `UpdateAsync(Guid id, Guid orgId, UpdateProgramYearRequest req)` fetches entity (throw `NotFoundException` if missing), validates dates, updates Name/StartDate/EndDate; method `ArchiveAsync(Guid id, Guid orgId)` sets `IsArchived = true`, `IsCurrent = false`; method `MarkCurrentAsync(Guid id, Guid orgId)` first lists all program years for the org and sets `IsCurrent = false` on each, then sets `IsCurrent = true` on the target (throw `NotFoundException` if target not found); all methods map entities to `ProgramYearDto` before returning

- [ ] Create `src/Stretto.Api/Controllers/ProgramYearsController.cs` with `[ApiController]`, `[Route("api/program-years")]`; constructor injects `ProgramYearService` and reads orgId from session cookie via `IAuthSessionStore`; `GET /api/program-years` → `ListAsync`, returns 200; `POST /api/program-years` → `CreateAsync`, returns 201 with `Created` location header; `GET /api/program-years/{id}` → `GetAsync`, returns 200; `PUT /api/program-years/{id}` → `UpdateAsync`, returns 200; `POST /api/program-years/{id}/archive` → `ArchiveAsync`, returns 200; `POST /api/program-years/{id}/mark-current` → `MarkCurrentAsync`, returns 200; all actions require an authenticated session (resolve orgId from session token in cookie; throw `UnauthorizedException` if token is missing or invalid)

- [ ] Register `ProgramYearService` in `src/Stretto.Api/Program.cs` with `builder.Services.AddScoped<ProgramYearService>()`
