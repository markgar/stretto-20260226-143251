## Milestone: Notifications – Backend (Domain, Application, and Infrastructure)

> **Validates:** After deploying, the following must work:
> - `POST /api/notifications/assignment-announcement` with `{ "programYearId": "<guid>", "subject": "Hello", "body": "Test" }` returns HTTP 204 (admin auth required)
> - `GET /api/notifications/assignment-recipients?programYearId=<guid>` returns HTTP 200 with a JSON array of recipient objects (admin auth required)
> - `POST /api/notifications/audition-announcement` with `{ "auditionDateId": "<guid>", "subject": "Auditions Open", "body": "Come audition" }` returns HTTP 204 (admin auth required)
> - `GET /api/notifications/audition-recipients?auditionDateId=<guid>` returns HTTP 200 with a JSON array
> - A member with `NotificationsEnabled = false` does NOT appear in the recipient preview list

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/Member.cs`
> - Repository: `src/Stretto.Infrastructure/Repositories/BaseRepository.cs`
> - Service interface: `src/Stretto.Application/Interfaces/IProjectMaterialsService.cs`
> - Service implementation: `src/Stretto.Application/Services/ProjectMaterialsService.cs`
> - Infrastructure stub pattern: `src/Stretto.Infrastructure/LocalFileStorageProvider.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

- [x] Add `NotificationsEnabled bool` property (default `true`) to the `Member` entity in `src/Stretto.Domain/Entities/Member.cs`

- [x] Create notification DTOs in `src/Stretto.Application/DTOs/NotificationDtos.cs`: `record RecipientDto(Guid MemberId, string Name, string Email)`; `record SendAssignmentAnnouncementRequest([Required] Guid ProgramYearId, [Required] string Subject, [Required] string Body)`; `record SendAuditionAnnouncementRequest([Required] Guid AuditionDateId, [Required] string Subject, [Required] string Body)`

- [x] Create `INotificationService` interface in `src/Stretto.Application/Interfaces/INotificationService.cs` with methods: `Task<List<RecipientDto>> GetAssignmentRecipientsAsync(Guid programYearId, Guid orgId)`; `Task SendAssignmentAnnouncementAsync(Guid programYearId, string subject, string body, Guid orgId)`; `Task<List<RecipientDto>> GetAuditionRecipientsAsync(Guid auditionDateId, Guid orgId)`; `Task SendAuditionAnnouncementAsync(Guid auditionDateId, string subject, string body, Guid orgId)`

- [x] Create `LogNotificationProvider` in `src/Stretto.Infrastructure/LogNotificationProvider.cs` implementing `INotificationProvider`; inject `ILogger<LogNotificationProvider>`; in `SendAsync` log an Information message: `"[NOTIFICATION] To: {to} | Subject: {subject} | Body: {body}"` and return `Task.CompletedTask` (no emails sent)

- [x] Register `INotificationProvider` in `src/Stretto.Api/Program.cs` as `builder.Services.AddScoped<INotificationProvider, LogNotificationProvider>()`

- [x] Create `NotificationService` in `src/Stretto.Application/Services/NotificationService.cs` implementing `INotificationService`; inject `INotificationProvider`, `IRepository<Member>`, `IRepository<ProjectAssignment>`, `IRepository<Project>`, `IRepository<AuditionDate>`; `GetAssignmentRecipientsAsync` lists all active members (`IsActive && NotificationsEnabled`) assigned to any project in the given program year (join ProjectAssignments → Projects filtered by `ProgramYearId`), deduplicating by MemberId; `SendAssignmentAnnouncementAsync` calls `GetAssignmentRecipientsAsync` then calls `_provider.SendAsync(r.Email, subject, body)` for each recipient; `GetAuditionRecipientsAsync` verifies the audition date exists (throw `NotFoundException` if not), then returns all active members with `NotificationsEnabled = true` in the org; `SendAuditionAnnouncementAsync` calls `GetAuditionRecipientsAsync` then sends to each

- [x] Register `INotificationService` in `src/Stretto.Api/Program.cs` as `builder.Services.AddScoped<INotificationService, NotificationService>()`
