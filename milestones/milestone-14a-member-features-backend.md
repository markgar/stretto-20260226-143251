# Milestone: Member Features — Backend

> **Validates:** After deployment, the validator should confirm:
> - `GET /health` returns `{"status":"healthy"}`
> - `GET /api/members/me` with a valid member session cookie returns `200` with a JSON body containing `id`, `firstName`, `lastName`, `email`, `notificationOptOut`
> - `PUT /api/members/me` with `{"firstName":"Test","lastName":"User","email":"mgarner@outlook.com","notificationOptOut":true}` and a valid member session returns `200`
> - `GET /api/members/me/projects` with a valid member session returns `200` with a JSON array
> - `GET /api/members/me/calendar` with a valid member session returns `200` with a JSON array
> - `GET /api/members/me/calendar.ics` with a valid member session returns `200` with `Content-Type: text/calendar` and body starting with `BEGIN:VCALENDAR`

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/Member.cs`
> - DTO: `src/Stretto.Application/DTOs/MemberDtos.cs`
> - Service interface: `src/Stretto.Application/Interfaces/IMemberService.cs`
> - Service implementation: `src/Stretto.Application/Services/MemberService.cs`
> - Controller: `src/Stretto.Api/Controllers/MembersController.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

## Tasks

- [ ] Add `NotificationOptOut bool` property (defaulting to `false`) to `Member` entity in `src/Stretto.Domain/Entities/Member.cs`

- [ ] Update `MemberDto` record in `src/Stretto.Application/DTOs/MemberDtos.cs` to add `NotificationOptOut bool` as the final positional parameter; add `UpdateMemberProfileRequest` record with `[Required][MaxLength(100)] string FirstName`, `[Required][MaxLength(100)] string LastName`, `[Required][EmailAddress][MaxLength(200)] string Email`, `bool NotificationOptOut`

- [ ] Add `CalendarEventDto` record to a new file `src/Stretto.Application/DTOs/MemberCalendarDtos.cs` with parameters `Guid EventId`, `Guid ProjectId`, `string ProjectName`, `string EventType`, `DateOnly Date`, `TimeOnly StartTime`, `int DurationMinutes`, `string? VenueName`; add `MemberProjectSummaryDto` record with `Guid ProjectId`, `string ProjectName`, `DateOnly StartDate`, `DateOnly EndDate`, `int UpcomingEventCount`

- [ ] Update `MemberService.ToDto` in `src/Stretto.Application/Services/MemberService.cs` to include `NotificationOptOut` in the returned `MemberDto`; update `CreateAsync` to initialise `NotificationOptOut = false`

- [ ] Add `GetMeAsync(Guid memberId, Guid orgId)` and `UpdateMeAsync(Guid memberId, Guid orgId, UpdateMemberProfileRequest req)` method signatures to `IMemberService` in `src/Stretto.Application/Interfaces/IMemberService.cs`

- [ ] Implement `GetMeAsync` and `UpdateMeAsync` in `MemberService`: `GetMeAsync` calls `GetByIdAsync` and throws `NotFoundException` if absent; `UpdateMeAsync` validates uniqueness of the new email (excluding the member's own current email), updates `FirstName`, `LastName`, `Email`, and `NotificationOptOut`, then calls `UpdateAsync`

- [ ] Create `IMemberCalendarService` interface in `src/Stretto.Application/Interfaces/IMemberCalendarService.cs` with two methods: `Task<List<MemberProjectSummaryDto>> GetProjectsAsync(Guid memberId, Guid orgId)` and `Task<List<CalendarEventDto>> GetUpcomingEventsAsync(Guid memberId, Guid orgId)`

- [ ] Create `MemberCalendarService` in `src/Stretto.Application/Services/MemberCalendarService.cs` implementing `IMemberCalendarService`; inject `IRepository<ProjectAssignment>`, `IRepository<Event>`, `IRepository<Project>`, `IRepository<Venue>`; `GetProjectsAsync` finds all assignments for the member, loads each project, counts upcoming events (date >= today) per project, returns sorted by project name; `GetUpcomingEventsAsync` finds all assignments, loads events with date >= today across all assigned projects, joins venue name, returns sorted by date then start time

- [ ] Create `ICalFeedGenerator` static class in `src/Stretto.Application/` (new file `ICalFeedGenerator.cs`) with a single static method `Generate(IEnumerable<CalendarEventDto> events, string calendarName) -> string` that builds a valid RFC 5545 iCal feed: `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//Stretto//Stretto//EN`, `X-WR-CALNAME:{calendarName}`, one `VEVENT` per event with `UID:{EventId}@stretto`, `DTSTART;VALUE=DATE:{Date:yyyyMMdd}`, `DTEND` computed from `StartTime + DurationMinutes`, `SUMMARY:{ProjectName} – {EventType}`, `END:VEVENT`, then `END:VCALENDAR`; fold lines longer than 75 octets per RFC 5545

- [ ] Register `IMemberCalendarService` → `MemberCalendarService` as scoped in `src/Stretto.Api/Program.cs`

- [ ] Create `MemberMeController` in `src/Stretto.Api/Controllers/MemberMeController.cs` extending `ProtectedControllerBase` with route prefix `api/members/me`; inject `IMemberService` and `IMemberCalendarService`; implement `GET /api/members/me` (calls `GetMeAsync(memberId, orgId)`), `PUT /api/members/me` (calls `UpdateMeAsync`), `GET /api/members/me/projects` (calls `GetProjectsAsync`), `GET /api/members/me/calendar` (calls `GetUpcomingEventsAsync`), `GET /api/members/me/calendar.ics` (calls `GetUpcomingEventsAsync` then `ICalFeedGenerator.Generate`, returns `Content("text/calendar", icalText)` with `Content-Disposition: attachment; filename="my-calendar.ics"` response header)

- [ ] Cleanup #198: Update `IAuditionService.ListByProgramYearAsync` in `src/Stretto.Application/Interfaces/IAuditionService.cs` to return `Task<IReadOnlyList<AuditionDateDto>>` instead of `Task<List<AuditionDateDto>>`; update the corresponding return type in `AuditionService.ListByProgramYearAsync` implementation in `src/Stretto.Application/Services/AuditionService.cs`
