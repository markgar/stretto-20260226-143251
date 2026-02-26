## Milestone: Events — CRUD API

> **Validates:**
> - `GET /api/events?projectId={id}` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to get a program year id; then `POST /api/projects` with dates within the program year to get a project id; then `POST /api/events` with body `{"projectId":"<id>","eventType":"Rehearsal","date":"<date within project range>","startTime":"19:00","durationMinutes":120,"venueId":null}` returns HTTP 201 with JSON body containing `id`, `projectId`, `eventType`, `date`, `startTime`, `durationMinutes`
> - `GET /api/events?projectId=<id>` returns HTTP 200 with a JSON array containing the created event
> - `GET /api/events/{id}` returns HTTP 200 with matching `eventType` and `date`
> - `PUT /api/events/{id}` with body `{"eventType":"Performance","date":"<same>","startTime":"18:00","durationMinutes":90,"venueId":null}` returns HTTP 200 with updated `eventType`
> - `POST /api/events` with `date` outside the project's date range returns HTTP 422
> - `POST /api/events` with `durationMinutes` of 0 or negative returns HTTP 422
> - `DELETE /api/events/{id}` returns HTTP 204; subsequent `GET /api/events/{id}` returns HTTP 404
> - `POST /api/events` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/Event.cs` — Event entity (Id, ProjectId, EventType, Date, StartTime, DurationMinutes, VenueId, OrganizationId)
> - `src/Stretto.Domain/Enums/EventType.cs` — EventType enum (Rehearsal=0, Performance=1)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic base repository; use `IRepository<Event>` directly
> - `src/Stretto.Application/Services/ProjectService.cs` — pattern for service: constructor-inject repositories, throw typed exceptions, validate, return DTOs
> - `src/Stretto.Api/Controllers/VenuesController.cs` — pattern for thin controller: `GetSessionAsync()` helper, delegate to service, return HTTP result
> - `src/Stretto.Api/Program.cs` — register new service with `builder.Services.AddScoped<IEventService, EventService>()`

- [ ] Create `src/Stretto.Application/DTOs/EventDtos.cs` with three records: `EventDto(Guid Id, Guid ProjectId, string EventType, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId, string? VenueName)`; `CreateEventRequest(Guid ProjectId, string EventType, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId)`; `UpdateEventRequest(string EventType, DateOnly Date, TimeOnly StartTime, int DurationMinutes, Guid? VenueId)`

- [ ] Create `src/Stretto.Application/Interfaces/IEventService.cs` with five method signatures: `Task<List<EventDto>> ListByProjectAsync(Guid projectId, Guid orgId)`; `Task<EventDto> GetAsync(Guid id, Guid orgId)`; `Task<EventDto> CreateAsync(Guid orgId, CreateEventRequest req)`; `Task<EventDto> UpdateAsync(Guid id, Guid orgId, UpdateEventRequest req)`; `Task DeleteAsync(Guid id, Guid orgId)`

- [ ] Create `src/Stretto.Application/Services/EventService.cs` implementing `IEventService`; constructor-inject `IRepository<Event>`, `IRepository<Project>`, and `IRepository<Venue>`; `ListByProjectAsync` calls `_events.ListAsync(orgId, e => e.ProjectId == projectId)` and maps to `EventDto` (join venue name by matching VenueId against loaded venues list); `GetAsync` fetches by id/orgId, throws `NotFoundException("Event not found")` if null, maps to `EventDto` including `VenueName` if VenueId is set; `CreateAsync` fetches the project with `_projects.GetByIdAsync(req.ProjectId, orgId)` (throw `NotFoundException("Project not found")` if null), throws `ValidationException(new Dictionary<string,string[]>{["durationMinutes"]=["Duration must be greater than zero"]})` if `req.DurationMinutes <= 0`, throws `ValidationException(new Dictionary<string,string[]>{["date"]=["Event date must fall within the project date range"]})` if `req.Date < project.StartDate || req.Date > project.EndDate`, parses `req.EventType` to the `EventType` enum (throw `ValidationException(new Dictionary<string,string[]>{["eventType"]=["Invalid event type"]})` if unrecognised), creates the entity and calls `AddAsync`, returns `EventDto`; `UpdateAsync` fetches existing event (throw `NotFoundException` if null), re-fetches project for date validation, applies same validations as `CreateAsync`, updates fields, calls `UpdateAsync`, returns `EventDto`; `DeleteAsync` fetches by id/orgId (throw `NotFoundException` if null) then calls `DeleteAsync`; include private `ToDto(Event e, string? venueName)` helper that maps `e.EventType.ToString()` to the EventType string field

- [ ] Register `IEventService` in `src/Stretto.Api/Program.cs`: add `using Stretto.Application.Interfaces;` if not already present; add `builder.Services.AddScoped<IEventService, EventService>();` after the `AddScoped<IProjectService, ProjectService>()` line

- [ ] Create `src/Stretto.Api/Controllers/EventsController.cs` with `[ApiController]`, `[Route("api/events")]`; constructor-inject `IEventService` and `IAuthService`; add private `GetSessionAsync()` helper (identical pattern to `VenuesController`: read `stretto_session` cookie, throw `UnauthorizedException` if null, call `_authService.ValidateAsync`, return `(dto.OrgId, dto.Role)`); implement: `GET /api/events?projectId={id}` → calls `GetSessionAsync()`, requires `projectId` query param (return 400 if missing), calls `ListByProjectAsync`, returns `Ok(list)`; `GET /api/events/{id}` → calls `GetSessionAsync()`, calls `GetAsync(id, orgId)`, returns `Ok(dto)`; `POST /api/events` → requires Admin role (throw `ForbiddenException("Only admins can create events")` otherwise), calls `CreateAsync`, returns `Created($"/api/events/{dto.Id}", dto)`; `PUT /api/events/{id}` → requires Admin role, calls `UpdateAsync`, returns `Ok(dto)`; `DELETE /api/events/{id}` → requires Admin role, calls `DeleteAsync`, returns `NoContent()`

- [ ] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so the new `/api/events` endpoints appear in `src/Stretto.Web/src/api/generated/`
