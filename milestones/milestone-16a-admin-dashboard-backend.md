## Milestone: Admin Dashboard – Backend

> **Validates:**
> - `GET /api/dashboard/summary` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`; then `GET /api/dashboard/summary` returns HTTP 200 with JSON body containing `programYearId`, `programYearName`, `upcomingEvents` (array), and `recentActivity` (array)
> - `GET /api/dashboard/summary` when no current program year exists returns HTTP 200 with `programYearId: null` and empty `upcomingEvents` and `recentActivity` arrays
> - `GET /api/dashboard/summary?programYearId={id}` with a valid program year id returns HTTP 200 with `programYearId` matching the requested id
> - `GET /api/dashboard/summary?programYearId={unknownId}` returns HTTP 404
> - `GET /api/dashboard/summary` authenticated as `mgarner@outlook.com` (Member role) returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/Event.cs` — entity shape; follow this pattern for adding `CreatedAt` to Member and ProjectAssignment
> - `src/Stretto.Infrastructure/Data/Configurations/EventConfiguration.cs` — Fluent API mapping pattern for adding `CreatedAt` property mapping
> - `src/Stretto.Application/Services/EventService.cs` — service pattern: constructor-inject repositories, call `ListAsync` with predicate, map to DTO
> - `src/Stretto.Api/Controllers/EventsController.cs` — thin controller inheriting `ProtectedControllerBase`; role check with `GetSessionAsync`; route and action patterns
> - `src/Stretto.Api/Program.cs` — add `AddScoped<IDashboardService, DashboardService>()` here
> - `src/Stretto.Infrastructure/Data/AppDbContext.cs` — no changes needed; `Member` and `ProjectAssignment` DbSets already registered

- [x] Add `public DateTime CreatedAt { get; set; } = DateTime.UtcNow;` to `src/Stretto.Domain/Entities/Member.cs`; add `builder.Property(m => m.CreatedAt).IsRequired();` to `src/Stretto.Infrastructure/Data/Configurations/MemberConfiguration.cs`

- [x] Add `public DateTime CreatedAt { get; set; } = DateTime.UtcNow;` to `src/Stretto.Domain/Entities/ProjectAssignment.cs`; add `builder.Property(pa => pa.CreatedAt).IsRequired();` to `src/Stretto.Infrastructure/Data/Configurations/ProjectAssignmentConfiguration.cs`

- [x] Create `src/Stretto.Application/DTOs/DashboardDtos.cs` with three records: `UpcomingEventDto(Guid Id, Guid ProjectId, string ProjectName, EventType EventType, DateOnly Date, TimeOnly StartTime, int DurationMinutes, string? VenueName)`; `RecentActivityItem(string ActivityType, string Description, DateTime OccurredAt)` where `ActivityType` is either `"NewMember"` or `"NewAssignment"`; `DashboardSummaryDto(Guid? ProgramYearId, string? ProgramYearName, List<UpcomingEventDto> UpcomingEvents, List<RecentActivityItem> RecentActivity)`

- [ ] Create `src/Stretto.Application/Interfaces/IDashboardService.cs` with two method signatures: `Task<DashboardSummaryDto> GetCurrentSummaryAsync(Guid orgId)` (uses the IsCurrent program year, returns empty summary if none); `Task<DashboardSummaryDto> GetSummaryAsync(Guid programYearId, Guid orgId)` (throws `NotFoundException("Program year not found")` if not found)

- [ ] Create `src/Stretto.Application/Services/DashboardService.cs` implementing `IDashboardService`; constructor-inject `IRepository<ProgramYear>`, `IRepository<Project>`, `IRepository<Event>`, `IRepository<Venue>`, `IRepository<Member>`, `IRepository<ProjectAssignment>`; `GetCurrentSummaryAsync` finds the current program year via `ListAsync(orgId, y => y.IsCurrent)` — returns `new DashboardSummaryDto(null, null, [], [])` if none found, otherwise calls `BuildSummaryAsync`; `GetSummaryAsync` calls `GetByIdAsync(programYearId, orgId)` (throw `NotFoundException("Program year not found")` if null) then calls `BuildSummaryAsync`; private `BuildSummaryAsync(ProgramYear year, Guid orgId)` fetches all projects in the year via `ListAsync(orgId, p => p.ProgramYearId == year.Id)`, gets all events for those projects filtered to `Date >= DateOnly.FromDateTime(DateTime.UtcNow) && Date <= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))`, resolves venue names, maps events to `UpcomingEventDto` sorted ascending by `Date` then `StartTime`; fetches members with `CreatedAt >= DateTime.UtcNow.AddDays(-14)` mapped to `RecentActivityItem("NewMember", $"{m.FirstName} {m.LastName} joined as a member", m.CreatedAt)`; fetches assignments with `CreatedAt >= DateTime.UtcNow.AddDays(-14)` and resolves member/project names, mapped to `RecentActivityItem("NewAssignment", $"{memberName} assigned to {projectName}", a.CreatedAt)`; merges and sorts activity list descending by `OccurredAt` and returns `DashboardSummaryDto`

- [ ] Register `IDashboardService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<IDashboardService, DashboardService>();` after the existing service registrations; add `using Stretto.Application.Interfaces;` and `using Stretto.Application.Services;` if not already present

- [ ] Create `src/Stretto.Api/Controllers/DashboardController.cs` with `[ApiController]`, `[Route("api/dashboard")]`, inheriting `ProtectedControllerBase`; constructor-inject `IDashboardService` and `IAuthService`; implement `GET /api/dashboard/summary` as `[HttpGet("summary")]`: call `GetSessionAsync()`, require Admin role (return `Forbid()` if role is not `"Admin"`), check for optional `[FromQuery] Guid? programYearId` — if provided call `GetSummaryAsync(programYearId.Value, orgId)`, otherwise call `GetCurrentSummaryAsync(orgId)`; return `Ok(dto)`
