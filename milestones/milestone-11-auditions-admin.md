# Milestone: Auditions — Admin Setup

> **Validates:**
> - `GET /api/audition-dates?programYearId={id}` returns 200 with an array (may be empty) when authenticated as admin
> - `POST /api/audition-dates` with `{ "programYearId": "<valid-guid>", "date": "2026-09-01", "startTime": "09:00", "endTime": "11:00", "blockLengthMinutes": 30 }` returns 201 with `id`, `slots` array of 4 entries at 09:00, 09:30, 10:00, 10:30
> - `POST /api/audition-dates` with `blockLengthMinutes` that does not divide evenly into the range returns 400
> - `GET /api/audition-dates/{id}` returns 200 with `slots` array
> - `DELETE /api/audition-dates/{id}` returns 204
> - `PATCH /api/audition-dates/{id}/slots/{slotId}/status` with `{ "status": "Accepted" }` returns 200 with updated slot
> - `PATCH /api/audition-dates/{id}/slots/{slotId}/notes` with `{ "notes": "Great range" }` returns 200 with updated slot
> - React app: `/auditions` renders the Auditions list page (heading visible, program year selector present)
> - React app: `/auditions/new` renders the create audition date form (date, startTime, endTime, blockLengthMinutes fields)
> - React app: `/auditions/{id}` renders the slot grid page with color-coded status badges

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/AuditionDate.cs`, `src/Stretto.Domain/Entities/AuditionSlot.cs`
> - DTO / interface: `src/Stretto.Application/DTOs/VenueDtos.cs`, `src/Stretto.Application/Interfaces/IVenueService.cs`
> - Service: `src/Stretto.Application/Services/VenueService.cs`
> - Controller: `src/Stretto.Api/Controllers/VenuesController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`
> - Frontend list page: `src/Stretto.Web/src/pages/VenuesListPage.tsx`
> - Frontend form page: `src/Stretto.Web/src/pages/VenueFormPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`

---

- [ ] Create `AuditionDateDto` record (`Id`, `ProgramYearId`, `Date` as `DateOnly`, `StartTime` as `TimeOnly`, `EndTime` as `TimeOnly`, `BlockLengthMinutes` as `int`, `Slots` as `List<AuditionSlotDto>`) and `AuditionSlotDto` record (`Id`, `AuditionDateId`, `SlotTime` as `TimeOnly`, `MemberId` as `Guid?`, `Status` as `string`, `Notes` as `string?`) in `src/Stretto.Application/DTOs/AuditionDtos.cs`
- [ ] Create `CreateAuditionDateRequest` record (`ProgramYearId` as `Guid`, `Date` as `DateOnly`, `StartTime` as `TimeOnly`, `EndTime` as `TimeOnly`, `BlockLengthMinutes` as `int` with `[Range(5, 480)]`) and `UpdateSlotStatusRequest` record (`Status` as `string`) and `UpdateSlotNotesRequest` record (`Notes` as `string?`) in `src/Stretto.Application/DTOs/AuditionDtos.cs`
- [ ] Create `IAuditionService` interface in `src/Stretto.Application/Interfaces/IAuditionService.cs` with methods: `ListByProgramYearAsync(Guid programYearId, Guid orgId)`, `GetAsync(Guid id, Guid orgId)`, `CreateAsync(Guid orgId, CreateAuditionDateRequest req)`, `DeleteAsync(Guid id, Guid orgId)`, `UpdateSlotStatusAsync(Guid dateId, Guid slotId, Guid orgId, string status)`, `UpdateSlotNotesAsync(Guid dateId, Guid slotId, Guid orgId, string? notes)`
- [ ] Create `AuditionService` in `src/Stretto.Application/Services/AuditionService.cs` implementing `IAuditionService`; `CreateAsync` validates that `(EndTime - StartTime).TotalMinutes` is divisible by `BlockLengthMinutes` (throw `ValidationException("Block length does not divide evenly into the audition window")` if not), then inserts `AuditionDate` and auto-generates `AuditionSlot` records at each interval (`SlotTime = StartTime + i * BlockLengthMinutes`, `Status = AuditionStatus.Pending`) using `IRepository<AuditionSlot>`; `ListByProgramYearAsync` returns dates for the given program year filtered by `orgId`; `GetAsync` returns the date with its slots loaded via `IRepository<AuditionSlot>.ListAsync(orgId, s => s.AuditionDateId == id)`
- [ ] Register `IAuditionService` / `AuditionService` in `src/Stretto.Api/Program.cs` with `AddScoped`
- [ ] Create `AuditionsController` in `src/Stretto.Api/Controllers/AuditionsController.cs` at route `api/audition-dates` with: `GET ?programYearId=` (list by program year, auth required), `POST` (create, admin only, returns 201), `GET {id}` (get with slots, auth required), `DELETE {id}` (admin only, returns 204), `PATCH {id}/slots/{slotId}/status` (admin only, returns 200), `PATCH {id}/slots/{slotId}/notes` (admin only, returns 200); use same `GetSessionAsync()` pattern as `VenuesController`
- [ ] Regenerate TypeScript API client by running `npm run generate` in `src/Stretto.Web` so `AuditionDatesService` and related types appear in `src/Stretto.Web/src/api/generated/`
- [ ] Create `AuditionsListPage` in `src/Stretto.Web/src/pages/AuditionsListPage.tsx`; fetch program years via generated client to populate a `<select data-testid="program-year-select">` selector; on selection fetch audition dates via `GET /api/audition-dates?programYearId=`; render a table with columns Date, Start, End, Block (minutes), Actions (View, Delete); heading `data-testid="auditions-heading"`; link to `/auditions/new` with `data-testid="add-audition-date-button"` kept to ≤40 lines per function
- [ ] Create `AuditionDateCreatePage` in `src/Stretto.Web/src/pages/AuditionDateCreatePage.tsx`; use React Hook Form + Zod schema with fields: `programYearId` (required Guid), `date` (required string in YYYY-MM-DD), `startTime` (required HH:mm), `endTime` (required HH:mm), `blockLengthMinutes` (required int min 5); on submit POST to `/api/audition-dates`, on success navigate to `/auditions/{newId}`; keep functions ≤40 lines
- [ ] Create `AuditionSlotGridPage` in `src/Stretto.Web/src/pages/AuditionSlotGridPage.tsx`; fetch `GET /api/audition-dates/{id}` on mount; render a grid of slot cards showing `SlotTime`, status badge with color-coding (Pending=amber bg, Accepted=green bg, Rejected=red bg, Waitlisted=blue bg) via Tailwind classes; each card carries `data-testid={`slot-${slot.id}`}`; keep functions ≤40 lines
- [ ] Add inline notes editor to `AuditionSlotGridPage`: each slot card shows a textarea pre-filled with `slot.notes`; on blur call `PATCH /api/audition-dates/{dateId}/slots/{slotId}/notes` with `{ notes }` and invalidate the query; textarea carries `data-testid={`notes-${slot.id}`}`
- [ ] Add status update dropdown to `AuditionSlotGridPage`: each slot card includes a `<select>` with options Pending, Accepted, Rejected, Waitlisted; on change call `PATCH /api/audition-dates/{dateId}/slots/{slotId}/status` with `{ status }` and invalidate the query; select carries `data-testid={`status-${slot.id}`}`
- [ ] Add auditions routes in `src/Stretto.Web/src/App.tsx`: replace the `<Route path="/auditions" element={<ComingSoon />} />` placeholder with `<Route path="/auditions" element={<AuditionsListPage />} />`, add `<Route path="/auditions/new" element={<AuditionDateCreatePage />} />` and `<Route path="/auditions/:id" element={<AuditionSlotGridPage />} />`
- [ ] Fix `VenuesListPage` and `VenueFormPage` to use the generated `VenuesService` API client instead of raw `fetch()`, check `response.ok` (or equivalent) on all calls, and refactor each component function to stay within ~40 lines by extracting small helper functions or sub-components (addresses findings #94, #97, #98)
