## Milestone: Audition Sign-Up — Backend API

> **Validates:**
> - `POST /api/public/auditions/{slotId}/signup` with body `{"firstName":"Jane","lastName":"Doe","email":"jane@example.com"}` returns HTTP 200 with `AuditionSlotDto` containing the slot's `id`, `slotTime`, `status: "Pending"`, and non-null `memberId`
> - A second `POST /api/public/auditions/{slotId}/signup` to the same slot returns HTTP 422 with `message` indicating the slot is already taken
> - `GET /api/public/auditions/{auditionDateId}` (unauthenticated, no cookie) returns HTTP 200 with JSON containing `id`, `date`, `startTime`, `endTime`, `blockLengthMinutes`, and a `slots` array where each slot has `id`, `slotTime`, `isAvailable: true`
> - `GET /api/public/auditions/{auditionDateId}` after sign-up shows the claimed slot with `isAvailable: false`

> **Reference files:**
> - `src/Stretto.Application/DTOs/AuditionDtos.cs` — existing DTO records; add new records here
> - `src/Stretto.Application/Interfaces/IAuditionService.cs` — service interface; add new method signatures here
> - `src/Stretto.Application/Services/AuditionService.cs` — existing service; extend with new methods and `IRepository<Member>` injection
> - `src/Stretto.Api/Controllers/AuthController.cs` — example of a public (no-auth) controller with plain `ControllerBase`
> - `src/Stretto.Api/Program.cs` — DI registration; confirm no new registrations are needed (generic repos are already registered)

- [x] Fix bug #224: in `src/Stretto.Application/Services/AuditionService.cs` `CreateAsync`, add a guard before the modulo check — if `req.BlockLengthMinutes <= 0` throw `ValidationException` with `["blockLengthMinutes"] = ["Block length must be a positive number"]`

- [x] Add three new DTO records to `src/Stretto.Application/DTOs/AuditionDtos.cs`: `AuditionSignUpRequest(string FirstName, string LastName, string Email)`; `PublicAuditionSlotDto(Guid Id, TimeOnly SlotTime, bool IsAvailable)`; `PublicAuditionDateDto(Guid Id, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, int BlockLengthMinutes, List<PublicAuditionSlotDto> Slots)`

- [x] Add two method signatures to `src/Stretto.Application/Interfaces/IAuditionService.cs`: `Task<PublicAuditionDateDto> GetPublicAuditionDateAsync(Guid auditionDateId)` and `Task<AuditionSlotDto> SignUpForSlotAsync(Guid slotId, AuditionSignUpRequest req)`

- [ ] Add `IRepository<Member> _members` to `AuditionService` constructor: update constructor signature in `src/Stretto.Application/Services/AuditionService.cs` to also accept `IRepository<Member> members`; assign to `private readonly IRepository<Member> _members`; add `using Stretto.Domain.Entities;` if not already present

- [ ] Implement `GetPublicAuditionDateAsync` in `AuditionService`: call `_dates.FindOneAsync(d => d.Id == auditionDateId)`, throw `NotFoundException("Audition date not found")` if null; load slots via `_slots.ListAsync(date.OrganizationId, s => s.AuditionDateId == auditionDateId)` ordered by `SlotTime`; map each slot to `PublicAuditionSlotDto` with `IsAvailable = slot.MemberId == null && slot.Status == AuditionStatus.Pending`; return `new PublicAuditionDateDto(date.Id, date.Date, date.StartTime, date.EndTime, date.BlockLengthMinutes, publicSlots)`

- [ ] Implement `SignUpForSlotAsync` in `AuditionService`: call `_slots.FindOneAsync(s => s.Id == slotId)`, throw `NotFoundException("Audition slot not found")` if null; if `slot.MemberId != null` throw `ValidationException(new Dictionary<string, string[]> { ["slot"] = ["This slot has already been claimed"] })`; validate `req.Email` is not null or whitespace (throw `ValidationException` with `["email"] = ["Email is required"]` if invalid); call `_members.FindOneAsync(m => m.OrganizationId == slot.OrganizationId && m.Email.ToLower() == req.Email.Trim().ToLower())` to find existing member; if null, create and `AddAsync` a new `Member` with `Id = Guid.NewGuid()`, `OrganizationId = slot.OrganizationId`, `FirstName = req.FirstName.Trim()`, `LastName = req.LastName.Trim()`, `Email = req.Email.Trim()`, `Role = Role.Member`, `IsActive = true`; set `slot.MemberId = member.Id`; call `_slots.UpdateAsync(slot)`; return `ToSlotDto(slot)`

- [ ] Create `src/Stretto.Api/Controllers/PublicAuditionsController.cs`: `[ApiController]`, `[Route("api/public/auditions")]`, inherits `ControllerBase` (NOT `ProtectedControllerBase`); constructor-inject `IAuditionService`; implement `GET /{auditionDateId:guid}` calling `GetPublicAuditionDateAsync` and returning `Ok(dto)`; implement `POST /{slotId:guid}/signup` accepting `[FromBody] AuditionSignUpRequest req`, calling `SignUpForSlotAsync`, returning `Ok(dto)`
