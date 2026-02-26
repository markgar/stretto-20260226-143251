# Milestone: Auditions — Admin Setup (Backend)

> **Validates:**
> - `GET /api/audition-dates?programYearId={id}` returns 200 with an array (may be empty) when authenticated as admin
> - `POST /api/audition-dates` with `{ "programYearId": "<valid-guid>", "date": "2026-09-01", "startTime": "09:00", "endTime": "11:00", "blockLengthMinutes": 30 }` returns 201 with `id`, `slots` array of 4 entries at 09:00, 09:30, 10:00, 10:30
> - `POST /api/audition-dates` with `blockLengthMinutes` that does not divide evenly into the range returns 400
> - `GET /api/audition-dates/{id}` returns 200 with `slots` array
> - `DELETE /api/audition-dates/{id}` returns 204
> - `PATCH /api/audition-dates/{id}/slots/{slotId}/status` with `{ "status": "Accepted" }` returns 200 with updated slot
> - `PATCH /api/audition-dates/{id}/slots/{slotId}/notes` with `{ "notes": "Great range" }` returns 200 with updated slot

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/AuditionDate.cs`, `src/Stretto.Domain/Entities/AuditionSlot.cs`
> - DTO / interface: `src/Stretto.Application/DTOs/VenueDtos.cs`, `src/Stretto.Application/Interfaces/IVenueService.cs`
> - Service: `src/Stretto.Application/Services/VenueService.cs`
> - Controller: `src/Stretto.Api/Controllers/VenuesController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

---

- [x] Create `AuditionDateDto` record (`Id`, `ProgramYearId`, `Date` as `DateOnly`, `StartTime` as `TimeOnly`, `EndTime` as `TimeOnly`, `BlockLengthMinutes` as `int`, `Slots` as `List<AuditionSlotDto>`) and `AuditionSlotDto` record (`Id`, `AuditionDateId`, `SlotTime` as `TimeOnly`, `MemberId` as `Guid?`, `Status` as `string`, `Notes` as `string?`) in `src/Stretto.Application/DTOs/AuditionDtos.cs`
- [x] Create `CreateAuditionDateRequest` record (`ProgramYearId` as `Guid`, `Date` as `DateOnly`, `StartTime` as `TimeOnly`, `EndTime` as `TimeOnly`, `BlockLengthMinutes` as `int` with `[Range(5, 480)]`) and `UpdateSlotStatusRequest` record (`Status` as `string`) and `UpdateSlotNotesRequest` record (`Notes` as `string?`) in `src/Stretto.Application/DTOs/AuditionDtos.cs`
- [x] Create `IAuditionService` interface in `src/Stretto.Application/Interfaces/IAuditionService.cs` with methods: `ListByProgramYearAsync(Guid programYearId, Guid orgId)`, `GetAsync(Guid id, Guid orgId)`, `CreateAsync(Guid orgId, CreateAuditionDateRequest req)`, `DeleteAsync(Guid id, Guid orgId)`, `UpdateSlotStatusAsync(Guid dateId, Guid slotId, Guid orgId, string status)`, `UpdateSlotNotesAsync(Guid dateId, Guid slotId, Guid orgId, string? notes)`
- [x] Create `AuditionService` in `src/Stretto.Application/Services/AuditionService.cs` implementing `IAuditionService`; `CreateAsync` validates that `(EndTime - StartTime).TotalMinutes` is divisible by `BlockLengthMinutes` (throw `ValidationException("Block length does not divide evenly into the audition window")` if not), then inserts `AuditionDate` and auto-generates `AuditionSlot` records at each interval (`SlotTime = StartTime + i * BlockLengthMinutes`, `Status = AuditionStatus.Pending`) using `IRepository<AuditionSlot>`; `ListByProgramYearAsync` returns dates for the given program year filtered by `orgId`; `GetAsync` returns the date with its slots loaded via `IRepository<AuditionSlot>.ListAsync(orgId, s => s.AuditionDateId == id)`
- [ ] Register `IAuditionService` / `AuditionService` in `src/Stretto.Api/Program.cs` with `AddScoped`
- [ ] Create `AuditionsController` in `src/Stretto.Api/Controllers/AuditionsController.cs` at route `api/audition-dates` with: `GET ?programYearId=` (list by program year, auth required), `POST` (create, admin only, returns 201), `GET {id}` (get with slots, auth required), `DELETE {id}` (admin only, returns 204), `PATCH {id}/slots/{slotId}/status` (admin only, returns 200), `PATCH {id}/slots/{slotId}/notes` (admin only, returns 200); use same `GetSessionAsync()` pattern as `VenuesController`
- [ ] Regenerate TypeScript API client by running `npm run generate` in `src/Stretto.Web` so `AuditionDatesService` and related types appear in `src/Stretto.Web/src/api/generated/`
