# Milestone: Attendance

> **Validates:** After deployment, the validator should confirm:
> - `POST /api/auth/login` with admin email returns 200 and sets `stretto_session` cookie
> - `GET /api/events/{eventId}/attendance` with admin session returns 200 with a JSON array (each item has `memberId`, `memberName`, `status`)
> - `PUT /api/events/{eventId}/attendance/{memberId}` with body `{"status":"Present"}` and admin session returns 200
> - `POST /api/checkin/{eventId}` with a valid member session returns 200
> - `PUT /api/events/{eventId}/attendance/me/excused` with member session returns 200
> - `GET /api/events/{eventId}/attendance` with no session returns 401
> - Frontend: `GET /checkin/{eventId}` page renders a full-width button with `data-testid="checkin-button"` (no nav chrome / AppShell)
> - Frontend: `GET /events/{eventId}` page renders `data-testid="attendance-panel"` when logged in as Admin
> - `GET /health` returns `{"status":"healthy"}`

> **Reference files:**
> - Entity: `src/Stretto.Domain/Entities/AttendanceRecord.cs`
> - Repository pattern: `src/Stretto.Infrastructure/Repositories/BaseRepository.cs`
> - Service pattern: `src/Stretto.Application/Services/EventService.cs`
> - Interface pattern: `src/Stretto.Application/Interfaces/IEventService.cs`
> - Controller pattern: `src/Stretto.Api/Controllers/EventsController.cs`
> - Base controller: `src/Stretto.Api/Controllers/ProtectedControllerBase.cs`
> - DI wiring: `src/Stretto.Api/Program.cs`
> - Page pattern: `src/Stretto.Web/src/pages/EventDetailPage.tsx`
> - App routing: `src/Stretto.Web/src/App.tsx`

## Tasks

- [ ] Add `src/Stretto.Application/DTOs/AttendanceDtos.cs` with records: `AttendanceSummaryItemDto(Guid MemberId, string MemberName, string? Status)` (Status is null when no record exists), `SetAttendanceStatusRequest(string Status)` where Status is one of "Present", "Excused", "Absent", `AttendanceRecordDto(Guid Id, Guid EventId, Guid MemberId, string Status)`

- [ ] Add `src/Stretto.Application/Interfaces/IAttendanceService.cs` with methods: `Task<List<AttendanceSummaryItemDto>> GetForEventAsync(Guid eventId, Guid orgId)`, `Task<AttendanceRecordDto> SetStatusAsync(Guid eventId, Guid memberId, Guid orgId, AttendanceStatus status)`, `Task<AttendanceRecordDto> CheckInAsync(Guid eventId, Guid memberId, Guid orgId)`, `Task<AttendanceRecordDto> ToggleExcusedAsync(Guid eventId, Guid memberId, Guid orgId)`

- [ ] Add `src/Stretto.Application/Services/AttendanceService.cs` implementing `IAttendanceService`; `GetForEventAsync`: loads the event by id+orgId (throws NotFoundException if missing), gets all ProjectAssignments filtered by projectId+orgId, gets all AttendanceRecords filtered by eventId+orgId, joins assignments to members (use IRepository<Member>) to get names, returns list with status null when no record; `SetStatusAsync`/`CheckInAsync`/`ToggleExcusedAsync`: find existing AttendanceRecord by EventId+MemberId (use FindOneAsync), create a new one if absent, set Status and save, return AttendanceRecordDto; `ToggleExcusedAsync` sets Status to Excused if not already Excused, otherwise sets to Absent

- [ ] Update `src/Stretto.Api/Controllers/ProtectedControllerBase.cs`: change `GetSessionAsync()` return type from `Task<(Guid orgId, string role)>` to `Task<(Guid orgId, string role, Guid memberId)>`; include `dto.Id` as the third element; update `VenuesController` and `ProgramYearsController` (which extend ProtectedControllerBase) to accept and ignore the new `memberId` element using `var (orgId, role, _) = await GetSessionAsync()`

- [ ] Add `src/Stretto.Api/Controllers/AttendanceController.cs` extending `ProtectedControllerBase`; inject `IAttendanceService`; `GET /api/events/{eventId}/attendance` — admin only (throw ForbiddenException if role != "Admin"), returns `GetForEventAsync(eventId, orgId)`; `PUT /api/events/{eventId}/attendance/{memberId}` — admin only, parses `SetAttendanceStatusRequest.Status` via `Enum.TryParse<AttendanceStatus>`, throws `ValidationException` on invalid value, calls `SetStatusAsync`, returns 200; `POST /api/checkin/{eventId}` — any authenticated member, calls `CheckInAsync(eventId, memberId, orgId)`, returns 200; `PUT /api/events/{eventId}/attendance/me/excused` — any authenticated member, calls `ToggleExcusedAsync(eventId, memberId, orgId)`, returns 200

- [ ] Register `IAttendanceService` → `AttendanceService` as scoped in `src/Stretto.Api/Program.cs` following the pattern of the existing service registrations

- [ ] [Cleanup #139] Migrate `ProjectsController` and `MembersController` and `EventsController` to extend `ProtectedControllerBase` (inject `IAuthService` via `base(authService)`) and remove their duplicated private `GetSessionAsync()` methods; update all callers inside each controller to use `var (orgId, role, _) = await GetSessionAsync()` (or `var (orgId, _,  memberId)` where memberId is needed)

- [ ] Run `npm run generate` in `src/Stretto.Web/` to regenerate the TypeScript API client from the updated OpenAPI spec; verify `src/Stretto.Web/src/api/generated/` contains updated `AttendanceService` or equivalent client methods

- [ ] Add `/checkin/:eventId` route to `src/Stretto.Web/src/App.tsx` inside the `<Route element={<ProtectedRoute />}>` block, pointing to a new `CheckInPage` component imported from `./pages/CheckInPage`

- [ ] Create `src/Stretto.Web/src/pages/CheckInPage.tsx` — no `AppShell`; full-height centered layout (`min-h-screen flex flex-col items-center justify-center p-6`); shows "Check In" as a heading; uses `useParams` to get `eventId`; renders a full-width green button (`data-testid="checkin-button"`, `className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-semibold py-6 rounded-xl"`) labeled "I'm here"; uses `useMutation` to call `POST /api/checkin/{eventId}`; on success, replaces button with a `<p data-testid="checkin-success">You're checked in!</p>` message; shows error text on failure

- [ ] Update `src/Stretto.Web/src/pages/EventDetailPage.tsx` to add an admin attendance panel — when `isAdmin` is true, render a section below event details with `data-testid="attendance-panel"`; fetch `GET /api/events/{eventId}/attendance` via `useQuery`; render a list of members with their status badges: Present=green badge, Excused=amber badge, Absent=red badge, null="—" gray; each row includes a `<select>` or set of buttons to update status via `useMutation` calling `PUT /api/events/{eventId}/attendance/{memberId}` with `{status: "Present"|"Excused"|"Absent"}`; include a check-in URL display: `<span data-testid="checkin-url">/checkin/{eventId}</span>` that admins can copy to share with members

- [ ] Update `src/Stretto.Web/src/pages/EventDetailPage.tsx` to add a member excused-absence section — when `user?.role === 'Member'`, fetch the member's own attendance status from `GET /api/events/{eventId}/attendance` and find their entry by memberId; render their current status badge; render a toggle button `data-testid="excuse-toggle"` labeled "Excuse my absence" (if not currently Excused) or "Remove excuse" (if Excused) that calls `PUT /api/events/{eventId}/attendance/me/excused` via `useMutation`
