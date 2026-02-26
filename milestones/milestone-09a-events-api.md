## Milestone: Events — API

> **Validates:**
> - `GET /api/events?projectId={id}` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to get a program year id; then `POST /api/projects` with dates within the program year; then `POST /api/events` with body `{"projectId":"<id>","type":0,"date":"<date within project range>","startTime":"18:30:00","durationMinutes":120,"venueId":null}` returns HTTP 201 with JSON body containing `id`, `projectId`, `type`, `date`, `startTime`, `durationMinutes`
> - `GET /api/events?projectId={id}` returns HTTP 200 with a JSON array containing the created event
> - `GET /api/events/{id}` returns HTTP 200 with matching `type` and `date`
> - `PUT /api/events/{id}` with updated `durationMinutes` returns HTTP 200 with updated value
> - `DELETE /api/events/{id}` returns HTTP 204; subsequent `GET /api/events/{id}` returns HTTP 404
> - `POST /api/events` with a `date` outside the project's `startDate`–`endDate` range returns HTTP 422
> - `POST /api/events` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/Event.cs` — Event entity (Id, ProjectId, EventType, Date, StartTime, DurationMinutes, VenueId, OrganizationId)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — `ListAsync(orgId, predicate)` for filtering by ProjectId
> - `src/Stretto.Application/Services/ProjectService.cs` — pattern for date-range validation and `ToDto` helper
> - `src/Stretto.Api/Controllers/ProjectsController.cs` — thin controller inheriting `ProtectedControllerBase`; role check pattern for Admin-only actions
> - `src/Stretto.Api/Program.cs` — DI registration; add `IEventService` here

- [x] Create `src/Stretto.Application/DTOs/EventDtos.cs` with three records: `EventDto(Guid Id, Guid ProjectId, EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId, string? VenueName)`; `CreateEventRequest(Guid ProjectId, EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId)`; `UpdateEventRequest(EventType Type, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId)`

- [x] Create `src/Stretto.Application/Interfaces/IEventService.cs` with five method signatures: `Task<List<EventDto>> ListByProjectAsync(Guid projectId, Guid orgId)`; `Task<EventDto> GetAsync(Guid id, Guid orgId)`; `Task<EventDto> CreateAsync(Guid orgId, CreateEventRequest req)`; `Task<EventDto> UpdateAsync(Guid id, Guid orgId, UpdateEventRequest req)`; `Task DeleteAsync(Guid id, Guid orgId)`

- [x] Create `src/Stretto.Application/Services/EventService.cs` implementing `IEventService`; constructor-inject `IRepository<Event>`, `IRepository<Project>`, and `IRepository<Venue>`; `ListByProjectAsync` calls `_events.ListAsync(orgId, e => e.ProjectId == projectId)` then maps each event to `EventDto` (resolve `VenueName` via a pre-loaded venue list from `_venues.ListAsync(orgId)`); `GetAsync` calls `GetByIdAsync(id, orgId)` (throw `NotFoundException("Event not found")` if null), then resolves `VenueName`; `CreateAsync` fetches the project with `_projects.GetByIdAsync(req.ProjectId, orgId)` (throw `NotFoundException("Project not found")` if null), then validates `req.Date >= project.StartDate && req.Date <= project.EndDate` (throw `ValidationException(new Dictionary<string,string[]>{["date"]=["Event date must fall within the project date range"]})` on failure), creates the entity and calls `_events.AddAsync`; `UpdateAsync` re-fetches the event (throw `NotFoundException` if null), re-fetches the project for the same date validation, updates fields; `DeleteAsync` fetches event (throw `NotFoundException` if null) then calls `_events.DeleteAsync`

- [x] Register `IEventService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IEventService, EventService>();` after the existing `AddScoped<IProjectService, ProjectService>()` line; add `using Stretto.Application.Interfaces;` and `using Stretto.Application.Services;` if not already present

- [x] Create `src/Stretto.Api/Controllers/EventsController.cs` with `[ApiController]`, `[Route("api/events")]`, inheriting `ProtectedControllerBase`; constructor-inject `IEventService` and `IAuthService`; implement: `GET /api/events?projectId={id}` (return 400 if `projectId` query param is missing, else call `ListByProjectAsync` and return `Ok(list)`); `GET /api/events/{id:guid}` (call `GetAsync`, return `Ok(dto)`); `POST /api/events` (require Admin role, call `CreateAsync`, return `Created($"/api/events/{dto.Id}", dto)`); `PUT /api/events/{id:guid}` (require Admin role, call `UpdateAsync`, return `Ok(dto)`); `DELETE /api/events/{id:guid}` (require Admin role, call `DeleteAsync`, return `NoContent()`)

- [x] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so `EventDto`, `CreateEventRequest`, `UpdateEventRequest`, and the `/api/events` endpoints appear in `src/Stretto.Web/src/api/generated/`
