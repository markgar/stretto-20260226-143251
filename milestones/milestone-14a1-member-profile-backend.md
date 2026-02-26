# Milestone: Member Features — Backend (Part 1: Member Profile)

> **Validates:** After deployment, the validator should confirm:
> - `GET /health` returns `{"status":"healthy"}`
> - `GET /api/members/me` with a valid member session cookie returns `200` with a JSON body containing `id`, `firstName`, `lastName`, `email`, `notificationOptOut`
> - `PUT /api/members/me` with `{"firstName":"Test","lastName":"User","email":"mgarner@outlook.com","notificationOptOut":true}` and a valid member session returns `200`

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/Member.cs`
> - DTO: `src/Stretto.Application/DTOs/MemberDtos.cs`
> - Service interface: `src/Stretto.Application/Interfaces/IMemberService.cs`
> - Service implementation: `src/Stretto.Application/Services/MemberService.cs`
> - Controller: `src/Stretto.Api/Controllers/MemberMeController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

## Tasks

- [x] Add `NotificationOptOut bool` property (defaulting to `false`) to `Member` entity in `src/Stretto.Domain/Entities/Member.cs`

- [x] Update `MemberDto` record in `src/Stretto.Application/DTOs/MemberDtos.cs` to add `NotificationOptOut bool` as the final positional parameter; add `UpdateMemberProfileRequest` record with `[Required][MaxLength(100)] string FirstName`, `[Required][MaxLength(100)] string LastName`, `[Required][EmailAddress][MaxLength(200)] string Email`, `bool NotificationOptOut`

- [x] Update `MemberService.ToDto` in `src/Stretto.Application/Services/MemberService.cs` to include `NotificationOptOut` in the returned `MemberDto`; update `CreateAsync` to initialise `NotificationOptOut = false`

- [x] Add `GetMeAsync(Guid memberId, Guid orgId)` and `UpdateMeAsync(Guid memberId, Guid orgId, UpdateMemberProfileRequest req)` method signatures to `IMemberService` in `src/Stretto.Application/Interfaces/IMemberService.cs`

- [x] Implement `GetMeAsync` and `UpdateMeAsync` in `MemberService`: `GetMeAsync` calls `GetByIdAsync` and throws `NotFoundException` if absent; `UpdateMeAsync` validates uniqueness of the new email (excluding the member's own current email), updates `FirstName`, `LastName`, `Email`, and `NotificationOptOut`, then calls `UpdateAsync`

- [ ] Cleanup #198: Update `IAuditionService.ListByProgramYearAsync` in `src/Stretto.Application/Interfaces/IAuditionService.cs` to return `Task<IReadOnlyList<AuditionDateDto>>` instead of `Task<List<AuditionDateDto>>`; update the corresponding return type in `AuditionService.ListByProgramYearAsync` implementation in `src/Stretto.Application/Services/AuditionService.cs`
