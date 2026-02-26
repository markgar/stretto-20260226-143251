# Milestone: Attendance — Backend

> **Validates:** After deployment, the validator should confirm:
> - `POST /api/auth/login` with admin email returns 200 and sets `stretto_session` cookie
> - `GET /api/events/{eventId}/attendance` with admin session returns 200 with a JSON array (each item has `memberId`, `memberName`, `status`)
> - `PUT /api/events/{eventId}/attendance/{memberId}` with body `{"status":"Present"}` and admin session returns 200
> - `POST /api/checkin/{eventId}` with a valid member session returns 200
> - `PUT /api/events/{eventId}/attendance/me/excused` with member session returns 200
> - `GET /api/events/{eventId}/attendance` with no session returns 401
> - `GET /health` returns `{"status":"healthy"}`

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/AttendanceRecord.cs`
> - Repository pattern: `src/Stretto.Infrastructure/Repositories/BaseRepository.cs`
> - Service pattern: `src/Stretto.Application/Services/EventService.cs`
> - Interface pattern: `src/Stretto.Application/Interfaces/IEventService.cs`
> - Controller pattern: `src/Stretto.Api/Controllers/EventsController.cs`
> - Base controller: `src/Stretto.Api/Controllers/ProtectedControllerBase.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`

## Tasks

- [x] Add `src/Stretto.Application/DTOs/AttendanceDtos.cs` with records: `AttendanceSummaryItemDto(Guid MemberId, string MemberName, string? Status)` (Status is null when no record exists), `SetAttendanceStatusRequest(string Status)` where Status is one of "Present", "Excused", "Absent", `AttendanceRecordDto(Guid Id, Guid EventId, Guid MemberId, string Status)`

- [x] Add `src/Stretto.Application/Interfaces/IAttendanceService.cs` with methods: `Task<List<AttendanceSummaryItemDto>> GetForEventAsync(Guid eventId, Guid orgId)`, `Task<AttendanceRecordDto> SetStatusAsync(Guid eventId, Guid memberId, Guid orgId, AttendanceStatus status)`, `Task<AttendanceRecordDto> CheckInAsync(Guid eventId, Guid memberId, Guid orgId)`, `Task<AttendanceRecordDto> ToggleExcusedAsync(Guid eventId, Guid memberId, Guid orgId)`

- [x] Add `src/Stretto.Application/Services/AttendanceService.cs` implementing `IAttendanceService`; `GetForEventAsync`: loads the event by id+orgId (throws NotFoundException if missing), gets all ProjectAssignments filtered by projectId+orgId, gets all AttendanceRecords filtered by eventId+orgId, joins assignments to members (use IRepository<Member>) to get names, returns list with status null when no record; `SetStatusAsync`/`CheckInAsync`/`ToggleExcusedAsync`: find existing AttendanceRecord by EventId+MemberId (use FindOneAsync), create a new one if absent, set Status and save, return AttendanceRecordDto; `ToggleExcusedAsync` sets Status to Excused if not already Excused, otherwise sets to Absent

- [x] Update `src/Stretto.Api/Controllers/ProtectedControllerBase.cs`: change `GetSessionAsync()` return type from `Task<(Guid orgId, string role)>` to `Task<(Guid orgId, string role, Guid memberId)>`; include `dto.Id` as the third element; update `VenuesController` and `ProgramYearsController` (which extend ProtectedControllerBase) to accept and ignore the new `memberId` element using `var (orgId, role, _) = await GetSessionAsync()`

- [x] Add `src/Stretto.Api/Controllers/AttendanceController.cs` extending `ProtectedControllerBase`; inject `IAttendanceService`; `GET /api/events/{eventId}/attendance` — admin only (throw ForbiddenException if role != "Admin"), returns `GetForEventAsync(eventId, orgId)`; `PUT /api/events/{eventId}/attendance/{memberId}` — admin only, parses `SetAttendanceStatusRequest.Status` via `Enum.TryParse<AttendanceStatus>`, throws `ValidationException` on invalid value, calls `SetStatusAsync`, returns 200; `POST /api/checkin/{eventId}` — any authenticated member, calls `CheckInAsync(eventId, memberId, orgId)`, returns 200; `PUT /api/events/{eventId}/attendance/me/excused` — any authenticated member, calls `ToggleExcusedAsync(eventId, memberId, orgId)`, returns 200

- [x] Register `IAttendanceService` → `AttendanceService` as scoped in `src/Stretto.Api/Program.cs` following the pattern of the existing service registrations

- [x] [Cleanup #139] Migrate `ProjectsController` and `MembersController` and `EventsController` to extend `ProtectedControllerBase` (inject `IAuthService` via `base(authService)`) and remove their duplicated private `GetSessionAsync()` methods; update all callers inside each controller to use `var (orgId, role, _) = await GetSessionAsync()` (or `var (orgId, _,  memberId)` where memberId is needed)
