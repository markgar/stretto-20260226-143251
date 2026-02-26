# DEPLOY.md — Stretto Deployment Guide

## Overview

Stretto is an ASP.NET Core 10.0 Web API with a React/Vite frontend. This document covers how to build and run it in Docker.

## Dockerfile

- **Location**: `Dockerfile` at repository root
- **Multi-stage build**: SDK image (`mcr.microsoft.com/dotnet/sdk:10.0`) for build, runtime image (`mcr.microsoft.com/dotnet/aspnet:10.0`) for final image
- **Build command**: `dotnet publish src/Stretto.Api/Stretto.Api.csproj -c Release -o /app/publish`
- **Entry point**: `dotnet Stretto.Api.dll`

## Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` | Required to enable Swagger UI |
| `ASPNETCORE_URLS` | `http://+:8080` | Container listens on port 8080 |

## Port Mappings

- API container port: `8080` → host port `7777` (mapped as `7777:8080`)
- Frontend container port: `5173` → host port `7778` (mapped as `7778:5173`)

## Docker Compose

```bash
export COMPOSE_PROJECT_NAME=stretto-20260226-143251
docker compose up -d
```

The `docker-compose.yml` defines:
- `app` service: the .NET API, mapped to host port 7777
- `frontend` service: the Vite dev server (node:22-alpine), mapped to host port 7778
- `playwright` service: for UI testing (in `testing` profile only)
- `stretto-net` bridge network

## Startup Sequence

1. No database startup required (uses EF Core InMemory)
2. No migrations needed
3. API starts immediately and is ready on first request
4. Frontend (Vite) takes ~15-30s to start (npm install runs on first start)

## Health Check

- **API endpoint**: `GET /health`
- **Expected response**: `HTTP 200` with body `{"status":"healthy"}`
- **Check**: `curl http://localhost:7777/health`
- **Frontend check**: `curl http://localhost:7778/` returns HTML

## Swagger / OpenAPI

- Available at `GET /swagger/v1/swagger.json` when `ASPNETCORE_ENVIRONMENT=Development`
- Swagger UI at `GET /swagger` (redirects to `/swagger/index.html`)

## Frontend (Vite) Notes

- The frontend service uses `node:22-alpine` and runs `npm install && npm run dev -- --host 0.0.0.0 --port 5173`
- `src/Stretto.Web/vite.config.ts` has `server: { allowedHosts: true }` to allow Docker container hostname access
- Playwright tests connect to the frontend via `http://frontend:5173` (Docker service name)
- Frontend is a standalone Vite SPA; it is NOT served by the .NET API in this setup

## Playwright Setup

- Docker image: `mcr.microsoft.com/playwright:v1.52.0-noble`
- `e2e/package.json` pins `@playwright/test` to `1.52.0` to match the Docker image
- Tests live in `e2e/ui-validation.spec.ts`
- Run: `docker compose run --rm playwright sh -c 'cd /app/e2e && npm install && npx playwright test --reporter=list'`

## Milestone 02b: Database + Infrastructure + API Wiring

Validated in milestone `milestone-02b-database-and-wiring`:

- **EF Core InMemory**: `AppDbContext` registered with `UseInMemoryDatabase("StrettoDB")` in `Program.cs`. No migrations needed.
- **DataSeeder**: `DataSeeder.SeedAsync` called after `app.Build()` using a DI scope. Inserts 1 org + 2 members if no organizations exist. Confirmed via EF Core log: "Saved 3 entities to in-memory store."
- **GlobalExceptionHandlerMiddleware**: Registered before route mappings in `Program.cs`. Maps `NotFoundException` → 404, `ValidationException` → 400, unhandled → 500. All with `application/json` Content-Type and `{"message":"..."}` body.
- **BaseRepository<T>**: Generic repository scoping queries to `OrganizationId` via `EF.Property<Guid>(e, "OrganizationId")`.
- **37 tests pass**: `dotnet test Stretto.sln` passes all 37 tests.
- **Playwright**: All 4 UI tests pass against frontend at `http://frontend:5173`.

## Milestone 03a: Authentication — Backend

Validated in milestone `milestone-03a-backend-auth`:

- **Auth endpoints**: `POST /auth/login`, `GET /auth/validate`, `POST /auth/logout` all work correctly.
- **Cookie**: `stretto_session` is set with `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`. Contains a random 32-char hex token (not user data).
- **Session store**: `InMemoryAuthSessionStore` (singleton) backed by `ConcurrentDictionary<string, Guid>`. Session is invalidated on logout.
- **UnauthorizedException**: Mapped to HTTP 401 `{"message":"..."}` by `GlobalExceptionHandlerMiddleware`.
- **Seed data**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all auth testing.
- **All auth endpoints verified**: `POST /auth/login` → 200 + user JSON, `GET /auth/validate` → 200, `POST /auth/logout` → 204.

## Milestone 03b: Authentication — App Shell

Validated in milestone `milestone-03b-frontend-app-shell`:

- **Vite proxy required**: Added `server.proxy` in `vite.config.ts` to forward `/api/*` requests to the backend (rewriting `/api` prefix away). Uses env var `VITE_API_URL` (set to `http://app:8080` in docker-compose.yml `frontend` service environment). Without this, `fetch('/api/auth/login')` from the frontend would 404.
- **Login flow**: POST `/api/auth/login` (proxied from frontend) → `/auth/login` on API → 200 with user JSON + `stretto_session` HttpOnly cookie.
- **Protected route**: Navigating to `/dashboard` without auth redirects to `/login`. After login, `/dashboard` shows the dashboard heading.
- **App shell**: Admin nav renders with suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Multiple nav elements exist (sidebar + mobile tab bar) — use `.first()` when selecting by testid.
- **All 10 Playwright tests pass** after fixes.

## Milestone 04a: Program Years — API

Validated in milestone `milestone-04a-program-years-api`:

- **ProgramYearsController**: Registered at `api/program-years`. All 6 endpoints work: GET list, POST create, GET by id, PUT update, POST archive, POST activate.
- **Authentication guard**: All endpoints return HTTP 401 `{"message":"Unauthorized"}` without a valid `stretto_session` cookie.
- **Activate mutual exclusivity**: `POST /api/program-years/{id}/activate` sets `isCurrent=true` for the activated year and `isCurrent=false` for all other years in the org.
- **Archive behavior**: `POST /api/program-years/{id}/archive` sets `isArchived=true` and `isCurrent=false`.
- **All 8 Playwright J-1 smoke tests pass**: sidebar shows Program Years nav link, clicking it loads without JS errors.
- **Cookie expiry fix**: `AuthController.Login` now sets `Expires = DateTimeOffset.UtcNow.AddHours(8)` on the session cookie (finding #61 fix).

## Milestone 04b: Program Years — Admin Pages

Validated in milestone `milestone-04b-program-years-admin-pages`:

- **Bug fixed**: `ProgramYearsController` was injecting `AuthService` (concrete) instead of `IAuthService`. All `/api/program-years` endpoints returned HTTP 500. Fixed by changing constructor parameter to `IAuthService`. (issue #127)
- **Program Years API**: Full CRUD at `/api/program-years` — GET list (200), POST create (201), GET by id (200), PUT update (200), POST activate (200), POST archive (200). All require `stretto_session` cookie.
- **Frontend pages**: `/program-years` renders `data-testid="program-years-heading"`. `/program-years/new` renders `data-testid="name-input"` and `data-testid="submit-button"`. Both pages are protected (unauthenticated → redirect to /login).
- **localStorage auth persistence**: `authStore.ts` now persists user in localStorage — page refresh no longer redirects to `/login`.
- **AppShell testid pattern**: Nav testids use suffixed format: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`.
- **All 9 new Playwright tests pass** in `e2e/program-years-validation.spec.ts`.
## Milestone 06a: Venues — CRUD API

Validated in milestone `milestone-06a-venues-crud-api`:

- **VenueService + VenuesController**: Full CRUD at `/api/venues` and `/api/venues/{id:guid}`. All endpoints require `stretto_session` cookie (enforced by `GetSessionAsync()` in `ProtectedControllerBase`).
- **Session expiry**: `InMemoryAuthSessionStore` now stores expiry (`DateTime.UtcNow.AddHours(8)`). Sessions expire after 8 hours.
- **Deactivated members**: `ValidateAsync` now throws `UnauthorizedException` for deactivated members.
- **All venue API tests pass**: `GET /api/venues` (401 unauthenticated, 200 authenticated), `POST /api/venues` → 201, `GET /api/venues/{id}` → 200, `PUT /api/venues/{id}` → 200, `DELETE /api/venues/{id}` → 204, subsequent `GET` → 404.
- **Auth route prefix inconsistency**: `AuthController` uses `[Route("auth")]` (no `/api` prefix), but `VenuesController` uses `[Route("api/venues")]`. Login URL is `/auth/login`, not `/api/auth/login`. Frontend `LoginPage.tsx` calls `/api/auth/login` — needs Vite proxy (see issue #90).

## Milestone 06b: Venues — Admin Pages

Validated in milestone `milestone-06b-venues-admin-pages`:

- **Venues list page**: `/venues` renders `<h1 data-testid="venues-heading">Venues</h1>` and `<Link data-testid="add-venue-button">Add Venue</Link>` inside AppShell.
- **Venue form page**: `/venues/new` renders `data-testid="name-input"`, `data-testid="address-input"`, `data-testid="contact-name-input"`, `data-testid="contact-email-input"`, `data-testid="contact-phone-input"`, and `data-testid="submit-button"`.
- **Routes added in App.tsx**: `/venues` → `VenuesListPage`, `/venues/new` → `VenueFormPage`, `/venues/:id/edit` → `VenueFormPage`.
- **Auth restore in App.tsx**: Added `useEffect` in `App.tsx` that calls `GET /api/auth/validate` on mount and calls `setUser` if successful. Waits for auth check (`authChecked` state) before rendering routes. This prevents premature ProtectedRoute redirects.
- **Playwright navigation**: Tests use React Router client-side navigation (click `data-testid="nav-venues"`) rather than `page.goto('/venues')` to avoid full page reload losing Zustand auth state (due to `Secure` cookie issue on HTTP).
- **All 17 Playwright tests pass** (7 venues tests + 10 previous shell tests).

## Known Gotchas

- **Vite proxy for API calls**: The frontend calls `/api/*` relative URLs. Vite's `server.proxy` in `vite.config.ts` must rewrite `/api` → `` and target `http://app:8080` (via `VITE_API_URL` env var). Without this proxy, API calls 404. The `VITE_API_URL=http://app:8080` env var is set in docker-compose.yml for the frontend service.
- **AppShell nav testids (milestone 04b)**: Nav items use suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Old tests using `nav-{label}` will fail.
- **Seed data email**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all authentication tests. (Note: REQUIREMENTS.md mentions `mgarner22@gmail.com` but DataSeeder uses `admin@example.com`.)
- **Secure cookie prevents page reload auth restore**: The `stretto_session` cookie is set with `Secure` flag. In the Docker HTTP setup, the browser does NOT send this cookie on page reload (only over HTTPS). Zustand state is lost on full page reload (`page.goto()`). In Playwright tests, use React Router client-side navigation (click nav links) instead of `page.goto()` for pages that require auth. The `loginAsAdmin` helper + nav link clicks work correctly.
- **Auth restore on reload (App.tsx)**: `App.tsx` calls `GET /api/auth/validate` on mount to restore auth state from the session cookie. This works in HTTPS production but NOT in the HTTP Docker dev setup due to the Secure cookie issue above.
- **Venues API route**: `GET /api/venues` (with `/api` prefix, proxied by Vite) returns `[]` for empty list, `401` without auth. Direct backend call: `GET http://localhost:7777/api/venues`.
- **Vite proxy for API calls (FIXED in milestone-09b)**: The frontend calls `/api/*` relative URLs. Two proxy rules are needed: `/api/auth` → rewrite to `/auth` (for AuthController at `[Route("auth")]`), and `/api` → no rewrite (for all other controllers at `[Route("api/...")]`). Using a single `/api` rule with rewrite breaks all data APIs. The fix is in `src/Stretto.Web/vite.config.ts`.
- **AppShell nav testids (milestone 04b)**: Nav items use suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Old tests using `nav-{label}` will fail.
- **Seed data email**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all authentication tests.
- **HTTPS redirect**: `app.UseHttpsRedirection()` is in Program.cs. In Docker with HTTP-only, this could cause redirect loops if the client follows redirects to HTTPS. Use `http://localhost:7777` directly — HTTP works fine.
- **Development environment required for Swagger**: Set `ASPNETCORE_ENVIRONMENT=Development` or Swagger endpoints won't be registered.
- **Dockerfile must copy ALL test project files**: Before `dotnet restore`, the Dockerfile must `COPY` all `.csproj` files referenced in `Stretto.sln`, including all test projects (`Stretto.Api.Tests`, `Stretto.Domain.Tests`, `Stretto.Application.Tests`, `Stretto.Infrastructure.Tests`). Missing any causes `dotnet restore` to fail with MSB3202.
- **Playwright version pinning**: `@playwright/test` in `e2e/package.json` must be pinned to match the Playwright Docker image version. Using `^1.52.0` will resolve to a newer version and fail. Use exact `1.52.0`.
- **Vite allowedHosts**: Without `server.allowedHosts: true` in `vite.config.ts`, Playwright requests from within Docker will be blocked with "Blocked request. This host not allowed."
- **Frontend npm install delay**: The frontend container runs `npm install` on first start — expect ~15-30 seconds before the Vite dev server is ready at http://localhost:7778/.
- **Secure cookie prevents page reload auth restore**: The `stretto_session` cookie is set with `Secure` flag. In the Docker HTTP setup, the browser does NOT send this cookie on page reload (only over HTTPS). Zustand state is lost on full page reload (`page.goto()`). In Playwright tests, use React Router client-side navigation (click nav links) instead of `page.goto()` for pages that require auth.

<<<<<<< HEAD
## Milestone 11b: Auditions — API Controllers

Validated in milestone `milestone-11b-auditions-api-controllers`:

- **AuditionDatesController**: Registered at `api/audition-dates`. All 4 endpoints work: GET list by programYearId, POST create (Admin only), GET by id, DELETE (Admin only).
- **AuditionSlotsController**: Registered at `api/audition-slots`. All 3 endpoints work: GET list by auditionDateId, PUT status (Admin only), PUT notes (Admin only).
- **IAuditionService registered**: `builder.Services.AddScoped<IAuditionService, AuditionService>()` in `Program.cs`.
- **Auth enforcement**: All endpoints return HTTP 401 without a valid `stretto_session` cookie. POST/DELETE require Admin role — Member returns HTTP 403.
- **Slot generation**: Creating an audition date automatically generates slots based on startTime, endTime, blockLengthMinutes (e.g., 09:00-12:00 / 15min = 12 slots). All slots start with status='Pending' and notes=null.
- **Slot shape**: Each slot has `id`, `auditionDateId`, `slotTime`, `memberId`, `status`, `notes`.
- **All 10 Playwright tests pass** in `e2e/auditions-validation.spec.ts`.
- **All 11 API tests pass** via Python urllib tests.
=======
## Milestone 10a: Attendance — Backend

Validated in milestone `milestone-10a-attendance-backend`:

- **AttendanceController**: Registered with routes `GET /api/events/{eventId}/attendance` (admin only), `PUT /api/events/{eventId}/attendance/{memberId}` (admin only), `POST /api/checkin/{eventId}` (any member), `PUT /api/events/{eventId}/attendance/me/excused` (any member).
- **ProtectedControllerBase 3-tuple**: `GetSessionAsync()` now returns `(orgId, role, memberId)`. Any controller that deconstructs with 2 variables will fail to compile with CS8132. `AuditionDatesController` and `AuditionSlotsController` were broken — fixed by changing `var (orgId, _)` to `var (orgId, _, _)` and `var (orgId, role)` to `var (orgId, role, _)`.
- **AttendanceService.GetForEventAsync**: Returns members assigned to the project via ProjectAssignments. Without project assignments, returns an empty array `[]` (valid per spec — endpoint returns 200 + JSON array).
- **AttendanceService.SetStatusAsync**: Creates or updates an AttendanceRecord regardless of project assignment. PUT endpoint works even without explicit member-project assignment.
- **ToggleExcused logic**: First call (no record) → Excused. Second call (Excused) → Absent. Third call (Absent) → Excused. Correct behavior verified.
- **No AssignmentsController**: Milestone 08a assignment endpoints (`POST /api/projects/{id}/assignments/{memberId}`) are not in this codebase. Attendance tests work without them as SetStatusAsync doesn't require project membership.
- **All 9 Playwright tests pass** in `e2e/attendance-validation.spec.ts`.
>>>>>>> 66fb56e ([validator] Fix build errors and add Playwright tests for milestone 10a: Attendance Backend)

## Building and Testing Locally (without Docker)

```bash
dotnet build Stretto.sln          # should exit 0
dotnet test Stretto.sln           # should exit 0 with 1 passing test
cd src/Stretto.Web && npm install && npm test   # should exit 0 with 1 passing test
cd src/Stretto.Web && npm run build             # should exit 0
```

Requires .NET 10 SDK and Node.js 22+ installed.

## Milestone 09b: Events — Pages

Validated in milestone `milestone-09b-events-pages`:

- **Vite proxy fix (critical)**: `vite.config.ts` had a single `/api` proxy rule with `rewrite: (path) => path.replace(/^\/api/, '')`. This stripped `/api` from ALL paths. Auth worked (AuthController is at `[Route("auth")]` — no `/api` prefix), but ALL data APIs failed (404) because ProjectsController, EventsController etc. are at `[Route("api/...")]`. Fixed by using two proxy entries: `/api/auth` (rewrite to `/auth`) + `/api` (no rewrite). This fix is required for ANY Playwright test that checks data loaded via the frontend.
- **EventsController**: Full CRUD at `/api/events`. GET list by `projectId` query param, POST create, GET by id, PUT update, DELETE. All return 401 without auth.
- **ProjectDetailPage tabs**: NOT using shadcn `<Tabs>` with `role="tab"`. Uses plain `<button>` elements with `data-testid="tab-{overview|events|members|materials}"`. Use `page.getByTestId('tab-events')` (not `page.getByRole('tab', ...)`).
- **EventDetailPage project link**: Link text is "View project" (not project name). Use `page.getByRole('link', { name: 'View project' })`.
- **Event type badge**: Rehearsal (type=0) shows indigo badge; Performance (type=1) shows purple badge.
- **Date format in EventDetailPage**: `format(date, 'EEEE, MMMM d, yyyy')` e.g. "Wednesday, October 15, 2025".
- **Date format in ProjectEventsTab**: `format(date, 'MMM d, yyyy')` e.g. "Oct 15, 2025". Each date is a `<Link>` to `/events/{id}`.
- **Add event button**: `data-testid="add-event-button"` in `ProjectEventsTab`.
- **All 11 Playwright tests pass** in `e2e/events-pages-validation.spec.ts`.
- **Auth tokens still work for frontend login**: Vite proxy `/api/auth` → `/auth` mapping maintained. `POST http://frontend:5173/api/auth/login` → `http://app:8080/auth/login` ✓.
- **Cookie pattern in Playwright tests**: Use `page.context().addCookies([{name: 'stretto_session', value: token, domain: 'frontend', path: '/', secure: false}])` + `localStorage.setItem('stretto_user', JSON.stringify(user))` pattern (from `loginViaApi` in venues-validation.spec.ts).

## Milestone 07a: Projects — CRUD API

Validated in milestone `milestone-07a-projects-api`:

- **Dockerfile fix**: The solution now references 4 test projects (`Stretto.Api.Tests`, `Stretto.Domain.Tests`, `Stretto.Application.Tests`, `Stretto.Infrastructure.Tests`). The Dockerfile must COPY all 4 `.csproj` files before `dotnet restore` or the restore step fails with "project file not found". Updated Dockerfile to copy all test projects.
- **ProjectsController**: Registered at `api/projects`. All 5 endpoints work: GET list by programYearId, POST create, GET by id, PUT update, DELETE.
- **Authentication guard**: All endpoints return HTTP 401 without a valid `stretto_session` cookie.
- **Authorization**: `POST`, `PUT`, `DELETE` require Admin role. Member role returns HTTP 403.
- **Date validation**: `POST /api/projects` with `startDate >= endDate` returns HTTP 400 with `{"message":"Validation failed","errors":{"startDate":["Start date must be before end date"]}}`.
- **App shell nav**: Projects nav item uses testid `nav-desktop-projects` (not `nav-projects`) due to multi-breakpoint nav pattern in AppShell.tsx.
- **All 14 Playwright tests pass** in `e2e/projects-validation.spec.ts`.

## Milestone 09a: Events — API

Validated in milestone `milestone-09a-events-api`:

- **EventsController**: Registered at `api/events`. All 5 endpoints work: GET list by projectId, POST create, GET by id, PUT update, DELETE.
- **Authentication guard**: All endpoints return HTTP 401 without a valid `stretto_session` cookie.
- **Authorization**: `POST`, `PUT`, `DELETE` require Admin role. Member role returns HTTP 403.
- **Date validation**: `POST /api/events` with date outside project's startDate–endDate range throws `ValidationException` mapped to HTTP 400. (Note: spec says 422 but implementation returns 400 — see issue #231.)
- **VenueName resolution**: `EventDto` includes `venueName` field resolved from the venue. When `venueId` is provided, `venueName` is populated.
- **EventType enum**: `type=0` is Rehearsal, `type=1` is Performance (integer enum).
- **All 10 Playwright tests pass** in `e2e/events-api-validation.spec.ts`.
- **EventService pattern**: Uses `_events.ListAsync(orgId, e => e.ProjectId == projectId)` for filtering. `IRepository<Event>`, `IRepository<Project>`, `IRepository<Venue>` all constructor-injected.

## Milestone 11a: Auditions — Application Service Layer

Validated in milestone `milestone-11a-auditions-api-service`:

- **AuditionService**: Implemented at `src/Stretto.Application/Services/AuditionService.cs`. All 6 methods work: `ListByProgramYearAsync`, `GetAsync`, `CreateAsync`, `DeleteAsync`, `UpdateSlotStatusAsync`, `UpdateSlotNotesAsync`.
- **Controllers added by validator**: `AuditionDatesController` at `api/audition-dates` and `AuditionSlotsController` at `api/audition-slots` were added to expose the service layer (the milestone implemented the service but not the controllers — controllers are scheduled for milestone 11b). These controllers follow the same thin pattern as `EventsController`.
- **UnprocessableEntityException added**: A new `UnprocessableEntityException` → HTTP 422 was added to `GlobalExceptionHandlerMiddleware`. The `AuditionService.CreateAsync` throws this (not `ValidationException`) for the block-length business rule (`blockLengthMinutes` must evenly divide duration). This matches the validates block which requires 422 for this case.
- **All 8 milestone API tests pass**: POST create (201, 6 slots), GET list (200), GET by id (200), DELETE (204 + 404), invalid blocks (422), GET slots (200 with Pending status), PUT status (200), PUT notes (200).
- **Audition date endpoints**: `POST /api/audition-dates` auto-generates time slots. For 9:00–12:00 with 30-min blocks: 6 slots at 09:00, 09:30, 10:00, 10:30, 11:00, 11:30.
- **Slot status values**: `AuditionStatus` enum values: `Pending`, `Accepted`, `Rejected`, `NoShow`. Serialized as strings.
- **Pre-existing failures (not this milestone)**: `program-years-validation.spec.ts` tests fail (frontend UI issue), `milestone-04a-validation.spec.ts` sidebar tests fail, and `projects-validation.spec.ts:116` expects 422 for date validation but `ValidationException` maps to 400.
