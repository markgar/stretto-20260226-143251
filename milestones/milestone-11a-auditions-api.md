## Milestone: Auditions — API

> **Validates:**
> - `GET /api/audition-dates?programYearId={id}` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/program-years` to get a program year id; then `POST /api/audition-dates` with body `{"programYearId":"<id>","date":"2026-06-01","startTime":"09:00:00","endTime":"12:00:00","blockLengthMinutes":30}` returns HTTP 201 with JSON body containing `id`, `programYearId`, `date`, `startTime`, `endTime`, `blockLengthMinutes`, and a `slots` array of 6 items each with a `slotTime` field
> - `GET /api/audition-dates?programYearId={id}` returns HTTP 200 with a JSON array containing the created audition date
> - `GET /api/audition-dates/{id}` returns HTTP 200 with matching `date` and `blockLengthMinutes`
> - `DELETE /api/audition-dates/{id}` returns HTTP 204; subsequent `GET /api/audition-dates/{id}` returns HTTP 404
> - `POST /api/audition-dates` with `blockLengthMinutes` that does not evenly divide the duration (e.g. `startTime:"09:00:00"`, `endTime:"12:00:00"`, `blockLengthMinutes":35`) returns HTTP 422 with a `message` field
> - `GET /api/audition-slots?auditionDateId={id}` returns HTTP 200 with the slot array; each slot has `id`, `slotTime`, `status` (`"Pending"`), `notes` (`null`)
> - `PUT /api/audition-slots/{slotId}/status` with body `{"status":"Accepted"}` returns HTTP 200 with `status` updated to `"Accepted"`
> - `PUT /api/audition-slots/{slotId}/notes` with body `{"notes":"Strong vocalist"}` returns HTTP 200 with `notes` updated
> - `POST /api/audition-dates` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/AuditionDate.cs` — AuditionDate entity (Id, ProgramYearId, Date, StartTime, EndTime, BlockLengthMinutes, OrganizationId)
> - `src/Stretto.Domain/Entities/AuditionSlot.cs` — AuditionSlot entity (Id, AuditionDateId, SlotTime, MemberId, Status, Notes, OrganizationId)
> - `src/Stretto.Application/Services/EventService.cs` — pattern for validation exceptions and `ToDto` helper
> - `src/Stretto.Api/Controllers/EventsController.cs` — thin controller with `GetSessionAsync()` helper and role guard pattern
> - `src/Stretto.Api/Program.cs` — DI registration; add `IAuditionService` here

- [ ] Create `src/Stretto.Application/DTOs/AuditionDtos.cs` with five records: `AuditionSlotDto(Guid Id, Guid AuditionDateId, TimeOnly SlotTime, Guid? MemberId, string Status, string? Notes)`; `AuditionDateDto(Guid Id, Guid ProgramYearId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, int BlockLengthMinutes, List<AuditionSlotDto> Slots)`; `CreateAuditionDateRequest(Guid ProgramYearId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, int BlockLengthMinutes)`; `UpdateSlotStatusRequest(string Status)`; `UpdateSlotNotesRequest(string? Notes)`

- [ ] Create `src/Stretto.Application/Interfaces/IAuditionService.cs` with six method signatures: `Task<List<AuditionDateDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)`; `Task<AuditionDateDto> GetAsync(Guid id, Guid orgId)`; `Task<AuditionDateDto> CreateAsync(Guid orgId, CreateAuditionDateRequest req)`; `Task DeleteAsync(Guid id, Guid orgId)`; `Task<AuditionSlotDto> UpdateSlotStatusAsync(Guid slotId, Guid orgId, string status)`; `Task<AuditionSlotDto> UpdateSlotNotesAsync(Guid slotId, Guid orgId, string? notes)`

- [ ] Create `src/Stretto.Application/Services/AuditionService.cs` implementing `IAuditionService`; constructor-inject `IRepository<AuditionDate>` and `IRepository<AuditionSlot>`; add private `ToSlotDto` that maps `AuditionSlot` to `AuditionSlotDto` (map `Status` as `slot.Status.ToString()`); add private `ToDto` that maps `AuditionDate` plus its pre-loaded slots list to `AuditionDateDto`

- [ ] Implement `ListByProgramYearAsync` in `AuditionService`: call `_dates.ListAsync(orgId, d => d.ProgramYearId == programYearId)` to get dates; then call `_slots.ListAsync(orgId, s => dateIds.Contains(s.AuditionDateId))` where `dateIds` is the set of date IDs; group slots by `AuditionDateId`; map each date to `AuditionDateDto` using `ToDto` with its matching slots ordered by `SlotTime`

- [ ] Implement `GetAsync` in `AuditionService`: call `_dates.GetByIdAsync(id, orgId)` (throw `NotFoundException("Audition date not found")` if null); load its slots with `_slots.ListAsync(orgId, s => s.AuditionDateId == id)` ordered by `SlotTime`; return `ToDto(date, slots)`

- [ ] Implement `CreateAsync` in `AuditionService`: validate `req.StartTime < req.EndTime` (throw `ValidationException` with `["startTime"] = ["Start time must be before end time"]` if false); compute `totalMinutes = (int)(req.EndTime - req.StartTime).TotalMinutes`; validate `totalMinutes % req.BlockLengthMinutes == 0` (throw `ValidationException` with `["blockLengthMinutes"] = ["Block length must evenly divide the total duration"]` if false); create and `AddAsync` the `AuditionDate` entity with a new `Guid.NewGuid()` Id; auto-generate slots: for `i = 0; i < totalMinutes / req.BlockLengthMinutes; i++` create an `AuditionSlot` with `SlotTime = req.StartTime.AddMinutes(i * req.BlockLengthMinutes)`, `Status = AuditionStatus.Pending`, `AuditionDateId = date.Id`, `OrganizationId = orgId`, new Guid Id; call `_slots.AddAsync` for each slot; return `ToDto(date, slots)`

- [ ] Implement `DeleteAsync` in `AuditionService`: fetch the date (throw `NotFoundException` if null); load its slots with `_slots.ListAsync(orgId, s => s.AuditionDateId == id)`; call `_slots.DeleteAsync` for each slot; then call `_dates.DeleteAsync(date)`

- [ ] Implement `UpdateSlotStatusAsync` in `AuditionService`: fetch the slot using `_slots.GetByIdAsync(slotId, orgId)` (throw `NotFoundException("Audition slot not found")` if null); parse the `status` string to `AuditionStatus` enum (throw `ValidationException` with `["status"] = ["Invalid status value"]` if parse fails); set `slot.Status`; call `_slots.UpdateAsync(slot)`; return `ToSlotDto(slot)`

- [ ] Implement `UpdateSlotNotesAsync` in `AuditionService`: fetch the slot (throw `NotFoundException` if null); set `slot.Notes = notes`; call `_slots.UpdateAsync(slot)`; return `ToSlotDto(slot)`

- [ ] Register `IAuditionService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IAuditionService, AuditionService>();` after the `AddScoped<IEventService, EventService>()` line; add `using Stretto.Application.Services;` if not already imported (it should be); confirm `using Stretto.Application.Interfaces;` is present

- [ ] Create `src/Stretto.Api/Controllers/AuditionDatesController.cs` with `[ApiController]`, `[Route("api/audition-dates")]`, inheriting `ControllerBase`; constructor-inject `IAuditionService` and `IAuthService`; include the `GetSessionAsync()` helper; implement: `GET /api/audition-dates?programYearId={id}` (return 400 if `programYearId` query param missing, else call `ListByProgramYearAsync` and return `Ok(list)`); `GET /api/audition-dates/{id:guid}` (call `GetAsync`, return `Ok(dto)`); `POST /api/audition-dates` (require Admin role, call `CreateAsync`, return `Created($"/api/audition-dates/{dto.Id}", dto)`); `DELETE /api/audition-dates/{id:guid}` (require Admin role, call `DeleteAsync`, return `NoContent()`)

- [ ] Create `src/Stretto.Api/Controllers/AuditionSlotsController.cs` with `[ApiController]`, `[Route("api/audition-slots")]`, inheriting `ControllerBase`; constructor-inject `IAuditionService` and `IAuthService`; include `GetSessionAsync()` helper; implement: `PUT /api/audition-slots/{id:guid}/status` (require Admin role, call `UpdateSlotStatusAsync`, return `Ok(dto)`); `PUT /api/audition-slots/{id:guid}/notes` (require Admin role, call `UpdateSlotNotesAsync`, return `Ok(dto)`)

- [ ] Regenerate the TypeScript client: run `cd src/Stretto.Web && npm run generate` so `AuditionDateDto`, `AuditionSlotDto`, `CreateAuditionDateRequest`, `UpdateSlotStatusRequest`, `UpdateSlotNotesRequest`, and the `/api/audition-dates` and `/api/audition-slots` endpoints appear in `src/Stretto.Web/src/api/generated/`
