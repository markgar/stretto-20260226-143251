## Milestone: Auditions — Application Service Layer

> **Validates:**
> - `POST /api/audition-dates` with body `{"programYearId":"<id>","date":"2026-06-01","startTime":"09:00:00","endTime":"12:00:00","blockLengthMinutes":30}` returns HTTP 201 with JSON body containing `id`, `programYearId`, `date`, `startTime`, `endTime`, `blockLengthMinutes`, and a `slots` array of 6 items each with a `slotTime` field
> - `GET /api/audition-dates?programYearId={id}` returns HTTP 200 with a JSON array containing the created audition date
> - `GET /api/audition-dates/{id}` returns HTTP 200 with matching `date` and `blockLengthMinutes`
> - `DELETE /api/audition-dates/{id}` returns HTTP 204; subsequent `GET /api/audition-dates/{id}` returns HTTP 404
> - `POST /api/audition-dates` with `blockLengthMinutes` that does not evenly divide the duration (e.g. `startTime:"09:00:00"`, `endTime:"12:00:00"`, `blockLengthMinutes":35`) returns HTTP 422 with a `message` field
> - `GET /api/audition-slots?auditionDateId={id}` returns HTTP 200 with the slot array; each slot has `id`, `slotTime`, `status` (`"Pending"`), `notes` (`null`)
> - `PUT /api/audition-slots/{slotId}/status` with body `{"status":"Accepted"}` returns HTTP 200 with `status` updated to `"Accepted"`
> - `PUT /api/audition-slots/{slotId}/notes` with body `{"notes":"Strong vocalist"}` returns HTTP 200 with `notes` updated

> **Reference files:**
> - `src/Stretto.Domain/Entities/AuditionDate.cs` — AuditionDate entity (Id, ProgramYearId, Date, StartTime, EndTime, BlockLengthMinutes, OrganizationId)
> - `src/Stretto.Domain/Entities/AuditionSlot.cs` — AuditionSlot entity (Id, AuditionDateId, SlotTime, MemberId, Status, Notes, OrganizationId)
> - `src/Stretto.Application/Services/EventService.cs` — pattern for validation exceptions and `ToDto` helper

- [x] Create `src/Stretto.Application/DTOs/AuditionDtos.cs` with five records: `AuditionSlotDto(Guid Id, Guid AuditionDateId, TimeOnly SlotTime, Guid? MemberId, string Status, string? Notes)`; `AuditionDateDto(Guid Id, Guid ProgramYearId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, int BlockLengthMinutes, List<AuditionSlotDto> Slots)`; `CreateAuditionDateRequest(Guid ProgramYearId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, int BlockLengthMinutes)`; `UpdateSlotStatusRequest(string Status)`; `UpdateSlotNotesRequest(string? Notes)`

- [x] Create `src/Stretto.Application/Interfaces/IAuditionService.cs` with six method signatures: `Task<List<AuditionDateDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)`; `Task<AuditionDateDto> GetAsync(Guid id, Guid orgId)`; `Task<AuditionDateDto> CreateAsync(Guid orgId, CreateAuditionDateRequest req)`; `Task DeleteAsync(Guid id, Guid orgId)`; `Task<AuditionSlotDto> UpdateSlotStatusAsync(Guid slotId, Guid orgId, string status)`; `Task<AuditionSlotDto> UpdateSlotNotesAsync(Guid slotId, Guid orgId, string? notes)`

- [x] Create `src/Stretto.Application/Services/AuditionService.cs` implementing `IAuditionService`; constructor-inject `IRepository<AuditionDate>` and `IRepository<AuditionSlot>`; add private `ToSlotDto` that maps `AuditionSlot` to `AuditionSlotDto` (map `Status` as `slot.Status.ToString()`); add private `ToDto` that maps `AuditionDate` plus its pre-loaded slots list to `AuditionDateDto`

- [x] Implement `ListByProgramYearAsync` in `AuditionService`: call `_dates.ListAsync(orgId, d => d.ProgramYearId == programYearId)` to get dates; then call `_slots.ListAsync(orgId, s => dateIds.Contains(s.AuditionDateId))` where `dateIds` is the set of date IDs; group slots by `AuditionDateId`; map each date to `AuditionDateDto` using `ToDto` with its matching slots ordered by `SlotTime`

- [x] Implement `GetAsync` in `AuditionService`: call `_dates.GetByIdAsync(id, orgId)` (throw `NotFoundException("Audition date not found")` if null); load its slots with `_slots.ListAsync(orgId, s => s.AuditionDateId == id)` ordered by `SlotTime`; return `ToDto(date, slots)`

- [x] Implement `CreateAsync` in `AuditionService`: validate `req.StartTime < req.EndTime` (throw `ValidationException` with `["startTime"] = ["Start time must be before end time"]` if false); compute `totalMinutes = (int)(req.EndTime - req.StartTime).TotalMinutes`; validate `totalMinutes % req.BlockLengthMinutes == 0` (throw `ValidationException` with `["blockLengthMinutes"] = ["Block length must evenly divide the total duration"]` if false); create and `AddAsync` the `AuditionDate` entity with a new `Guid.NewGuid()` Id; auto-generate slots: for `i = 0; i < totalMinutes / req.BlockLengthMinutes; i++` create an `AuditionSlot` with `SlotTime = req.StartTime.AddMinutes(i * req.BlockLengthMinutes)`, `Status = AuditionStatus.Pending`, `AuditionDateId = date.Id`, `OrganizationId = orgId`, new Guid Id; call `_slots.AddAsync` for each slot; return `ToDto(date, slots)`

- [x] Implement `DeleteAsync` in `AuditionService`: fetch the date (throw `NotFoundException` if null); load its slots with `_slots.ListAsync(orgId, s => s.AuditionDateId == id)`; call `_slots.DeleteAsync` for each slot; then call `_dates.DeleteAsync(date)`

- [x] Implement `UpdateSlotStatusAsync` in `AuditionService`: fetch the slot using `_slots.GetByIdAsync(slotId, orgId)` (throw `NotFoundException("Audition slot not found")` if null); parse the `status` string to `AuditionStatus` enum (throw `ValidationException` with `["status"] = ["Invalid status value"]` if parse fails); set `slot.Status`; call `_slots.UpdateAsync(slot)`; return `ToSlotDto(slot)`

- [ ] Implement `UpdateSlotNotesAsync` in `AuditionService`: fetch the slot (throw `NotFoundException` if null); set `slot.Notes = notes`; call `_slots.UpdateAsync(slot)`; return `ToSlotDto(slot)`
