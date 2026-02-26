## Milestone: Auditions — API Controllers

> **Validates:**
> - `GET /api/audition-dates?programYearId={id}` without a session cookie returns HTTP 401
> - `POST /api/audition-dates` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403
> - `GET /api/audition-dates?programYearId={id}` returns HTTP 200 with a JSON array containing the created audition date
> - `GET /api/audition-dates/{id}` returns HTTP 200 with matching `date` and `blockLengthMinutes`
> - `DELETE /api/audition-dates/{id}` returns HTTP 204; subsequent `GET /api/audition-dates/{id}` returns HTTP 404
> - `GET /api/audition-slots?auditionDateId={id}` returns HTTP 200 with the slot array; each slot has `id`, `slotTime`, `status` (`"Pending"`), `notes` (`null`)
> - `PUT /api/audition-slots/{slotId}/status` with body `{"status":"Accepted"}` returns HTTP 200 with `status` updated to `"Accepted"`
> - `PUT /api/audition-slots/{slotId}/notes` with body `{"notes":"Strong vocalist"}` returns HTTP 200 with `notes` updated

> **Reference files:**
> - `src/Stretto.Application/Interfaces/IAuditionService.cs` — service interface (from milestone-11a-auditions-api-service)
> - `src/Stretto.Application/DTOs/AuditionDtos.cs` — DTOs (from milestone-11a-auditions-api-service)
> - `src/Stretto.Api/Controllers/EventsController.cs` — thin controller with `GetSessionAsync()` helper and role guard pattern
> - `src/Stretto.Api/Program.cs` — DI registration; add `IAuditionService` here

- [x] Register `IAuditionService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IAuditionService, AuditionService>();` after the `AddScoped<IEventService, EventService>()` line; add `using Stretto.Application.Services;` if not already imported (it should be); confirm `using Stretto.Application.Interfaces;` is present

- [x] Create `src/Stretto.Api/Controllers/AuditionDatesController.cs` with `[ApiController]`, `[Route("api/audition-dates")]`, inheriting `ControllerBase`; constructor-inject `IAuditionService` and `IAuthService`; include the `GetSessionAsync()` helper; implement: `GET /api/audition-dates?programYearId={id}` (return 400 if `programYearId` query param missing, else call `ListByProgramYearAsync` and return `Ok(list)`); `GET /api/audition-dates/{id:guid}` (call `GetAsync`, return `Ok(dto)`); `POST /api/audition-dates` (require Admin role, call `CreateAsync`, return `Created($"/api/audition-dates/{dto.Id}", dto)`); `DELETE /api/audition-dates/{id:guid}` (require Admin role, call `DeleteAsync`, return `NoContent()`)

- [ ] Create `src/Stretto.Api/Controllers/AuditionSlotsController.cs` with `[ApiController]`, `[Route("api/audition-slots")]`, inheriting `ControllerBase`; constructor-inject `IAuditionService` and `IAuthService`; include `GetSessionAsync()` helper; implement: `GET /api/audition-slots?auditionDateId={id}` (return 400 if `auditionDateId` query param missing, else call `ListByProgramYearAsync` scoped to the date and return `Ok(slots)`); `PUT /api/audition-slots/{id:guid}/status` (require Admin role, call `UpdateSlotStatusAsync`, return `Ok(dto)`); `PUT /api/audition-slots/{id:guid}/notes` (require Admin role, call `UpdateSlotNotesAsync`, return `Ok(dto)`)

- [ ] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so `AuditionDateDto`, `AuditionSlotDto`, `CreateAuditionDateRequest`, `UpdateSlotStatusRequest`, `UpdateSlotNotesRequest`, and the `/api/audition-dates` and `/api/audition-slots` endpoints appear in `src/Stretto.Web/src/api/generated/`
