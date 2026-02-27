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

## Milestone 10b: Attendance — Frontend

Validated in milestone `milestone-10b-attendance-frontend`:

- **Build fix**: `AuditionDatesController.cs` and `AuditionSlotsController.cs` used 2-element tuple deconstruction `var (orgId, _) = await GetSessionAsync()` but `GetSessionAsync()` returns a 3-element tuple `(Guid orgId, string role, Guid memberId)`. Fixed to `var (orgId, _, _)` and `var (orgId, role, _)` as appropriate.
- **CheckInPage route**: `/checkin/:eventId` is in `App.tsx` inside `<Route element={<ProtectedRoute />}>`. The page renders without AppShell, just a full-height centered layout with `data-testid="checkin-button"`.
- **AttendancePanel**: `EventDetailPage.tsx` renders `data-testid="attendance-panel"` only when `isAdmin` is true AND the event data has loaded. If the event API call fails (e.g., due to auth), the panel won't render.
- **Playwright route mocking**: To test `attendance-panel` and `checkin-url` visibility, use `page.route()` to mock `GET /api/events/{id}` and `GET /api/events/{id}/attendance` responses. This avoids the Secure cookie/Vite proxy issue where the browser may not send the session cookie on API calls.
- **Direct API login in Playwright tests**: Use `request.post('http://app:8080/auth/login')` (not through the frontend Vite proxy) to get a session token for pre-test setup. Parse the `set-cookie` header to extract the session value.
- **All 7 attendance Playwright tests pass** in `e2e/attendance-validation.spec.ts`.

## Known Gotchas

- **Vite proxy for API calls**: The frontend calls `/api/*` relative URLs. Vite's `server.proxy` in `vite.config.ts` must rewrite `/api` → `` and target `http://app:8080` (via `VITE_API_URL` env var). Without this proxy, API calls 404. The `VITE_API_URL=http://app:8080` env var is set in docker-compose.yml for the frontend service.
- **AppShell nav testids (milestone 04b)**: Nav items use suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Old tests using `nav-{label}` will fail.
- **Seed data email**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all authentication tests. (Note: REQUIREMENTS.md mentions `mgarner22@gmail.com` but DataSeeder uses `admin@example.com`.)
- **Secure cookie prevents page reload auth restore**: The `stretto_session` cookie is set with `Secure` flag. In the Docker HTTP setup, the browser does NOT send this cookie on page reload (only over HTTPS). Zustand state is lost on full page reload (`page.goto()`). In Playwright tests, use React Router client-side navigation (click nav links) instead of `page.goto()` for pages that require auth. The `loginAsAdmin` helper + nav link clicks work correctly.
- **Auth restore on reload (App.tsx)**: `App.tsx` calls `GET /api/auth/validate` on mount to restore auth state from the session cookie. This works in HTTPS production but NOT in the HTTP Docker dev setup due to the Secure cookie issue above.
- **Venues API route**: `GET /api/venues` (with `/api` prefix, proxied by Vite) returns `[]` for empty list, `401` without auth. Direct backend call: `GET http://localhost:7777/api/venues`.
- **Vite proxy for API calls (FIXED in milestone-09b)**: The frontend calls `/api/*` relative URLs. Two proxy rules are needed: `/api/auth` → rewrite to `/auth` (for AuthController at `[Route("auth")]`), and `/api` → no rewrite (for all other controllers at `[Route("api/...")]`). Using a single `/api` rule with rewrite breaks all data APIs. The fix is in `src/Stretto.Web/vite.config.ts`.
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
- **AppShell nav testids (milestone 04b)**: Nav items use suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Old tests using `nav-{label}` will fail.
- **Seed data email**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all authentication tests.
=======
- **AppShell nav testids (milestone 04b)**: Nav items now use suffixed testids: `nav-desktop-{label}`, `nav-tablet-{label}`, `nav-mobile-{label}`. Old tests using `nav-{label}` will fail.
- **Seed data email**: `DataSeeder` seeds `mgarner22@gmail.com` (Admin) and `mgarner@outlook.com` (Member). Use `mgarner22@gmail.com` for all authentication tests. Note: `auth-validation.spec.ts` still uses old `admin@example.com` — those tests are broken (issue #83).
>>>>>>> 84a2957 ([validator] Validate milestone-13b: Project Materials Frontend — all 10 UI tests pass)
=======
>>>>>>> 5464f80 ([validator] Validate milestone-14a1: Member Profile Backend)
=======
- **Seed data email (milestone-16b verified)**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use `admin@example.com` for all Playwright authentication tests. The `mgarner22@gmail.com` email from REQUIREMENTS.md does NOT work — the actual seeded email is `admin@example.com`.
>>>>>>> 083b7a8 ([validator] Validate milestone-16b: Admin Dashboard — Frontend)
- **HTTPS redirect**: `app.UseHttpsRedirection()` is in Program.cs. In Docker with HTTP-only, this could cause redirect loops if the client follows redirects to HTTPS. Use `http://localhost:7777` directly — HTTP works fine.
- **Development environment required for Swagger**: Set `ASPNETCORE_ENVIRONMENT=Development` or Swagger endpoints won't be registered.
- **Dockerfile must copy ALL test project files**: Before `dotnet restore`, the Dockerfile must `COPY` all `.csproj` files referenced in `Stretto.sln`, including all test projects (`Stretto.Api.Tests`, `Stretto.Domain.Tests`, `Stretto.Application.Tests`, `Stretto.Infrastructure.Tests`). Missing any causes `dotnet restore` to fail with MSB3202.
- **Playwright version pinning**: `@playwright/test` in `e2e/package.json` must be pinned to match the Playwright Docker image version. Using `^1.52.0` will resolve to a newer version and fail. Use exact `1.52.0`.
- **Vite allowedHosts**: Without `server.allowedHosts: true` in `vite.config.ts`, Playwright requests from within Docker will be blocked with "Blocked request. This host not allowed."
- **Frontend npm install delay**: The frontend container runs `npm install` on first start — expect ~15-30 seconds before the Vite dev server is ready at http://localhost:7778/.
- **Secure cookie prevents page reload auth restore**: The `stretto_session` cookie is set with `Secure` flag. In the Docker HTTP setup, the browser does NOT send this cookie on page reload (only over HTTPS). Zustand state is lost on full page reload (`page.goto()`). In Playwright tests, use React Router client-side navigation (click nav links) instead of `page.goto()` for pages that require auth.

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
## Milestone 12a: Audition Sign-Up — Backend API

Validated in milestone `milestone-12a-audition-signup-backend`:

- **PublicAuditionsController**: New controller at `api/public/auditions` — inherits `ControllerBase` (NOT `ProtectedControllerBase`), so no auth cookie required.
- **GET /api/public/auditions/{auditionDateId}**: Returns `PublicAuditionDateDto` with `id`, `date`, `startTime`, `endTime`, `blockLengthMinutes`, and `slots[]` each with `id`, `slotTime`, `isAvailable`. Works unauthenticated.
- **POST /api/public/auditions/{slotId}/signup**: Accepts `{"firstName","lastName","email"}`. Returns 200 `AuditionSlotDto` with `status: "Pending"` and non-null `memberId`. Creates new member if email not found in org.
- **Duplicate signup**: Returns HTTP 422 (mapped from `ValidationException`) with `{"message":"This slot has already been claimed"}`.
- **isAvailable logic**: `slot.MemberId == null && slot.Status == AuditionStatus.Pending` — after signup, claimed slot shows `isAvailable: false`.
- **Playwright APIRequestContext cookie workaround**: For `beforeAll` that needs admin auth, extract `stretto_session` from `Set-Cookie` response header and pass it manually in subsequent request `Cookie` header (Secure cookie isn't sent over HTTP automatically).
- **AuditionSlotsController route**: Slot updates at `PUT /api/audition-slots/{id}/status` and `PUT /api/audition-slots/{id}/notes` (not `PUT /api/audition-slots/{id}`).
>>>>>>> b7c4ab8 ([validator] Add milestone 12a audition signup backend validation tests and update DEPLOY.md)
=======
## Milestone 13a: Project Materials — Backend (Links and Documents API)

Validated in milestone `milestone-13a-project-materials-backend`:

- **ProjectMaterialsController**: Registered at `api/projects/{projectId:guid}`. Links at `/links` and documents at `/documents`.
- **Links endpoints**: `POST /api/projects/{id}/links` → 201 (admin only), `GET /api/projects/{id}/links` → 200 (any auth), `DELETE /api/projects/{id}/links/{linkId}` → 204 (admin only, 403 for member).
- **Documents endpoints**: `POST /api/projects/{id}/documents` → 201 (admin only, multipart/form-data with `file` and `title`), `GET /api/projects/{id}/documents` → 200 (any auth), `GET /api/projects/{id}/documents/{docId}/download` → 200 with `Content-Disposition: attachment` (any auth), `DELETE /api/projects/{id}/documents/{docId}` → 204 (admin only).
- **LocalFileStorageProvider**: Stores uploads in `uploads/` directory inside the container. File saved as `{Guid}_{originalFileName}`.
- **All unauthenticated requests return 401** before any business logic runs.
- **All 11 Playwright tests pass** in `e2e/project-materials-validation.spec.ts`.
- **Playwright test pattern**: Use `request` fixture (direct to `http://app:8080`) for API tests, NOT `page.evaluate` with `fetch` (which goes through Vite proxy that strips `/api` prefix).
>>>>>>> ff22540 ([validator] Milestone 13a: Project Materials Backend validation — all tests pass)
=======
## Milestone 08a: Member Assignments – Backend

Validated in milestone `milestone-08a-member-assignments-backend`:

- **ProjectAssignmentService**: `IProjectAssignmentService` registered as scoped. Implements `ListProjectMembersAsync`, `AssignAsync`, `UnassignAsync`, `GetUtilizationGridAsync`.
- **ProjectsController sub-resources**: `GET /api/projects/{id}/members` → 200 JSON array with `memberId`, `fullName`, `email`, `isAssigned`; `POST /api/projects/{id}/members` → 201 (admin-only); `DELETE /api/projects/{id}/members/{memberId}` → 204 (admin-only).
- **ProgramYearsController utilization**: `GET /api/program-years/{id}/utilization` → 200 `{ projects: [...], members: [...] }` where each member has `assignedCount`, `totalProjects`, `assignedProjectIds`.
- **Error cases**: non-existent projectId → 404; non-existent programYearId → 404; duplicate assignment → 409 with `{"message":"Member is already assigned to this project"}`.
- **All 7 Playwright API tests pass** in `e2e/member-assignments-validation.spec.ts`.
>>>>>>> fd524ef ([validator] Validate milestone-08a: Member Assignments Backend - all tests pass)
=======
## Milestone 16a: Admin Dashboard — Backend

Validated in milestone `milestone-16a-admin-dashboard-backend`:

- **DashboardController**: Registered at `api/dashboard`. `GET /api/dashboard/summary` requires Admin role; Members get 403.
- **Bug fixed**: `DashboardController` used `return Forbid()` (ASP.NET Core built-in) which causes HTTP 500 because no authentication scheme is configured. Fixed to `throw new ForbiddenException("Only admins can view the dashboard")` — matching the pattern used by EventsController, ProjectsController, etc.
- **Optional `programYearId` query param**: `GET /api/dashboard/summary?programYearId={guid}` → specific year; no param → current year. Unknown ID → 404.
- **No current year**: Returns HTTP 200 with `{"programYearId":null,"programYearName":null,"upcomingEvents":[],"recentActivity":[]}`.
- **recentActivity**: `ActivityType` values are `"NewMember"` and `"NewAssignment"`. Members seeded by `DataSeeder` appear in `recentActivity` immediately.
- **Seed data uses admin@example.com**: Despite DEPLOY.md notes from milestone 09b claiming `mgarner22@gmail.com`, the actual `DataSeeder.cs` seeds `admin@example.com` (Admin) and `member@example.com` (Member). The `mgarner22@gmail.com` email in REQUIREMENTS.md and milestone specs is NOT the seeded email.
- **All 5 Playwright API tests pass** in `e2e/dashboard-backend-validation.spec.ts`.
>>>>>>> 92ee22f ([validator] Validate milestone-16a: Admin Dashboard Backend)
=======
## Milestone 08b: Member Assignments + Utilization Grid – Frontend

Validated in milestone `milestone-08b-member-assignments-utilization-frontend`:

- **Seed data email (corrected)**: `DataSeeder` actually seeds `admin@example.com` (Admin) and `member@example.com` (Member). Earlier DEPLOY.md entries claiming `mgarner22@gmail.com` were incorrect. Use `admin@example.com` for all authentication tests.
- **ProjectMembersTab**: Renders at `data-testid="member-search-input"` + member rows with `data-testid="assign-{memberId}"` / `data-testid="unassign-{memberId}"` buttons. Search filters by name or email.
- **ProjectDetailPage members tab**: Replaced "Coming soon" placeholder with `<ProjectMembersTab projectId={id!} />`. `data-testid="tab-members"` click shows the assignment UI.
- **UtilizationGridPage**: Renders at `/utilization` with `data-testid="program-year-select"`. Desktop shows full table (member name, utilization count, colored cells). Mobile shows grouped list.
- **Project assignment endpoints**: `GET /api/projects/{id}/members` → 200 list; `POST /api/projects/{id}/members` → 201; `DELETE /api/projects/{id}/members/{memberId}` → 204. All require auth (401 without).
- **Utilization endpoint**: `GET /api/program-years/{id}/utilization` → 200 `{projects:[...], members:[{memberId, fullName, assignedCount, totalProjects, assignedProjectIds}]}`.
- **All 13 Playwright tests pass** in `e2e/member-assignments-validation.spec.ts`.
- **Playwright pattern for navigation to project pages**: Use `page.goto(FRONTEND_BASE + '/projects/{id}')` directly after `loginViaApi()` — this works because `loginViaApi` sets localStorage `stretto_user` (Zustand persists across goto).
>>>>>>> 955966d ([validator] Validate milestone-08b: Member Assignments + Utilization Grid Frontend)

## Building and Testing Locally (without Docker)

```bash
dotnet build Stretto.sln          # should exit 0
dotnet test Stretto.sln           # should exit 0 with 1 passing test
cd src/Stretto.Web && npm install && npm test   # should exit 0 with 1 passing test
cd src/Stretto.Web && npm run build             # should exit 0
```

Requires .NET 10 SDK and Node.js 22+ installed.

<<<<<<< HEAD
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
=======
## Milestone 12b: Audition Sign-Up — Frontend Pages

Validated in milestone `milestone-12b-audition-signup-frontend`:

- **Public routes in App.tsx**: `/auditions/:auditionDateId` → `AuditionSignUpPage` and `/auditions/confirmation` → `AuditionConfirmationPage` are defined outside `<ProtectedRoute>`. Both render without redirecting to login.
- **AuditionSignUpPage**: Calls `GET /api/public/auditions/{auditionDateId}` via raw `fetch` (no credentials). Renders date header, slot grid with Available/Taken badges, and a sign-up form when a slot is selected. On successful sign-up, navigates to `/auditions/confirmation` with `{ state: { slotTime, date } }`.
- **AuditionConfirmationPage**: Reads `location.state` for `slotTime` and `date`. Renders "You're signed up!" heading, formatted date/time, and "Please arrive a few minutes early" note.
- **CRITICAL BUG FIXED (issue #391)**: The Vite proxy in `vite.config.ts` stripped the `/api` prefix from ALL API calls, but only `AuthController` uses `[Route("auth")]` (without `/api`). All other controllers use `[Route("api/...")]`. Fixed by splitting into two proxy rules:
  ```js
  '/api/auth': { target, rewrite: path => path.replace(/^\/api/, ''), changeOrigin: true },
  '/api': { target, changeOrigin: true },  // no rewrite — preserves /api prefix
  ```
- **All 8 Playwright tests pass** in `e2e/audition-signup-validation.spec.ts`.
- **Note**: Frontend container needs restart after `vite.config.ts` change (config is read at startup).


>>>>>>> e47852d ([validator] Fix Vite proxy, add audition sign-up UI tests, update DEPLOY.md)

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

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 84a2957 ([validator] Validate milestone-13b: Project Materials Frontend — all 10 UI tests pass)
=======
>>>>>>> 5464f80 ([validator] Validate milestone-14a1: Member Profile Backend)
=======
>>>>>>> 083b7a8 ([validator] Validate milestone-16b: Admin Dashboard — Frontend)
## Milestone 11a: Auditions — Application Service Layer

Validated in milestone `milestone-11a-auditions-api-service`:

- **AuditionService**: Implemented at `src/Stretto.Application/Services/AuditionService.cs`. All 6 methods work: `ListByProgramYearAsync`, `GetAsync`, `CreateAsync`, `DeleteAsync`, `UpdateSlotStatusAsync`, `UpdateSlotNotesAsync`.
- **Controllers added by validator**: `AuditionDatesController` at `api/audition-dates` and `AuditionSlotsController` at `api/audition-slots` were added to expose the service layer (the milestone implemented the service but not the controllers — controllers are scheduled for milestone 11b). These controllers follow the same thin pattern as `EventsController`.
- **UnprocessableEntityException added**: A new `UnprocessableEntityException` → HTTP 422 was added to `GlobalExceptionHandlerMiddleware`. The `AuditionService.CreateAsync` throws this (not `ValidationException`) for the block-length business rule (`blockLengthMinutes` must evenly divide duration). This matches the validates block which requires 422 for this case.
- **All 8 milestone API tests pass**: POST create (201, 6 slots), GET list (200), GET by id (200), DELETE (204 + 404), invalid blocks (422), GET slots (200 with Pending status), PUT status (200), PUT notes (200).
- **Audition date endpoints**: `POST /api/audition-dates` auto-generates time slots. For 9:00–12:00 with 30-min blocks: 6 slots at 09:00, 09:30, 10:00, 10:30, 11:00, 11:30.
- **Slot status values**: `AuditionStatus` enum values: `Pending`, `Accepted`, `Rejected`, `NoShow`. Serialized as strings.
- **Pre-existing failures (not this milestone)**: `program-years-validation.spec.ts` tests fail (frontend UI issue), `milestone-04a-validation.spec.ts` sidebar tests fail, and `projects-validation.spec.ts:116` expects 422 for date validation but `ValidationException` maps to 400.
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
## Milestone 08a: Member Assignments – Backend

Validated in milestone `milestone-08a-member-assignments-backend`:

- **ProjectAssignmentService**: Registered as scoped in `Program.cs`. Implements `IProjectAssignmentService` with 4 methods.
- **Assignment endpoints on ProjectsController**: `GET /api/projects/{id}/members` → 200 (array with memberId, fullName, email, isAssigned), `POST /api/projects/{id}/members` → 201 (assigns member), `DELETE /api/projects/{id}/members/{memberId}` → 204.
- **Utilization endpoint on ProgramYearsController**: `GET /api/program-years/{id}/utilization` → 200 with `{ projects: [...], members: [...] }` where each member has `memberId`, `fullName`, `assignedCount`, `totalProjects`, `assignedProjectIds`.
- **404 behavior**: `GET /api/projects/{nonExistentId}/members` → 404 `{"message":"Project not found"}`. `GET /api/program-years/{nonExistentId}/utilization` → 404 `{"message":"Program year not found"}`.
- **All 7 Playwright tests pass** in `e2e/member-assignments-validation.spec.ts`.
<<<<<<< HEAD
>>>>>>> 72ed2a5 ([validator] Validate milestone 08a: Member Assignments – Backend)
=======

## Milestone 16a: Admin Dashboard – Backend

Validated in milestone `milestone-16a-admin-dashboard-backend`:

- **DashboardController**: Registered at `api/dashboard`. Single endpoint: `GET /api/dashboard/summary`.
- **Authentication guard**: `GET /api/dashboard/summary` returns HTTP 401 without a valid `stretto_session` cookie.
- **Authorization**: Requires Admin role. Member role returns HTTP 403.
- **Optional query param**: `GET /api/dashboard/summary?programYearId={id}` uses that program year; without it, uses the current program year.
- **No current program year**: Returns HTTP 200 with `{"programYearId":null,"programYearName":null,"upcomingEvents":[],"recentActivity":[]}`.
- **Unknown programYearId**: Returns HTTP 404 `{"message":"Program year not found"}`.
- **Response shape**: `{ programYearId, programYearName, upcomingEvents: [...], recentActivity: [...] }`. Each `recentActivity` item has `activityType` ("NewMember"/"NewAssignment"), `description`, `occurredAt`.
- **Seed data email**: DataSeeder uses `admin@example.com` (Admin) and `member@example.com` (Member). Note: milestone spec references `mgarner22@gmail.com` but the actual seeder uses `admin@example.com`.
- **CreatedAt fields added**: `Member.CreatedAt` and `ProjectAssignment.CreatedAt` added to domain entities and EF Core configurations for `recentActivity` lookback (last 14 days).
- **All 10 validation tests pass**.
>>>>>>> 6fdbd47 ([validator] Validate milestone-16a: Admin Dashboard – Backend)
=======

## Milestone 13b: Project Materials — Frontend (Admin + Member UI)

Validated in milestone `milestone-13b-project-materials-frontend`:

- **Merge conflicts resolved**: `UnprocessableEntityException.cs`, `GlobalExceptionHandlerMiddleware.cs`, `AuditionDatesController.cs`, `AuditionSlotsController.cs` all had unresolved merge conflict markers from milestone 11a. Resolved by keeping HEAD versions (ProtectedControllerBase pattern with 3-tuple `(orgId, role, memberId)`).
- **ProjectMaterialsTab implemented**: `src/Stretto.Web/src/components/ProjectMaterialsTab.tsx` — renders Links and Documents sections; admin gets add-link form and upload-document form; member gets read-only view.
- **ProjectDetailPage updated**: Materials tab no longer shows "Coming soon" placeholder — renders `<ProjectMaterialsTab projectId={id!} />`.
- **Materials API endpoints all work**: GET/POST/DELETE `/api/projects/{id}/links`, GET/POST/DELETE `/api/projects/{id}/documents`, GET `/api/projects/{id}/documents/{docId}/download`.
- **Admin add-link form testids**: `data-testid="link-title-input"`, `data-testid="link-url-input"`, `data-testid="add-link-button"`.
- **Link row testids**: `data-testid="link-{id}"` (anchor), `data-testid="delete-link-{id}"` (delete button, admin only).
- **Admin upload form testids**: `data-testid="upload-document-title-input"`, `data-testid="upload-document-input"` (file input), `data-testid="upload-document-button"`.
- **Document row testids**: `data-testid="download-document-{id}"` (anchor), `data-testid="delete-document-{id}"` (delete button, admin only).
- **Seed emails confirmed**: `admin@example.com` / `password` (Admin), `member@example.com` / `password` (Member). DataSeeder uses these values — NOT `mgarner22@gmail.com`.
- **Playwright document upload**: Use `page.request.post()` with `multipart:` option to upload documents in tests; `page.evaluate()` with `fetch()` does NOT work because the browser context cannot reach `app:8080` directly.
- **getByText() strict mode**: Use `getByRole('heading', { name: 'Links' })` instead of `getByText('Links')` to avoid strict mode violations when "No links yet" text also contains "links".
- **All 10 Playwright tests pass** in `e2e/materials-validation.spec.ts`.
>>>>>>> 84a2957 ([validator] Validate milestone-13b: Project Materials Frontend — all 10 UI tests pass)
=======

## Milestone 14a1: Member Features — Backend (Part 1: Member Profile)

Validated in milestone `milestone-14a1-member-profile-backend`:

- **MemberMeController**: Registered at `api/members/me`. Both endpoints work: `GET /api/members/me` returns the authenticated member's profile; `PUT /api/members/me` updates firstName, lastName, email, notificationOptOut.
- **NotificationOptOut field**: Added to `Member` entity, `MemberDto`, and `MemberService.ToDto`. Defaults to `false` on creation.
- **GetMeAsync / UpdateMeAsync**: Both methods added to `IMemberService` and implemented in `MemberService`. `UpdateMeAsync` validates email uniqueness (excluding self).
- **Authentication guard**: Both endpoints return HTTP 401 without a valid `stretto_session` cookie.
- **Merge conflicts resolved**: Multiple .cs files had unresolved merge conflict markers (from earlier validator commits vs HEAD). Resolved keeping HEAD versions: `UnprocessableEntityException.cs`, `GlobalExceptionHandlerMiddleware.cs`, `AuditionDatesController.cs`, `AuditionSlotsController.cs`.
- **Seed data (confirmed)**: `DataSeeder` seeds `admin@example.com` (Admin) and `member@example.com` (Member). Use these emails for all tests. DEPLOY.md had conflicting info — `admin@example.com` / `member@example.com` is correct (verified from DataSeeder source).
- **All 7 Playwright tests pass** in `e2e/member-profile-validation.spec.ts`.
>>>>>>> 5464f80 ([validator] Validate milestone-14a1: Member Profile Backend)
=======

## Milestone 16b: Admin Dashboard — Frontend

Validated in milestone `milestone-16b-admin-dashboard-frontend`:

- **DashboardController**: Registered at `api/dashboard`. GET `/api/dashboard/summary` returns `DashboardSummaryDto` with `programYearId`, `programYearName`, `upcomingEvents[]`, `recentActivity[]`. Returns 401 without auth, 403 for non-Admin.
- **DashboardPage**: Located at `src/Stretto.Web/src/pages/DashboardPage.tsx`. Renders `data-testid="dashboard-heading"` (text: "Dashboard") and `data-testid="program-year-select"` (default option "Current Year"). Uses `useDashboard` and `useProgramYearsList` hooks.
- **useDashboard hook**: `src/Stretto.Web/src/pages/useDashboard.ts`. Uses `useQuery` with `queryKey: ['dashboard', selectedYearId]` and calls `DashboardService.getApiDashboardSummary`.
- **Skeleton loader**: `data-testid="dashboard-skeleton"` shown while `isLoading` is true.
- **Upcoming events**: When empty, `data-testid="no-upcoming-events"` shown. When populated, `data-testid="upcoming-event-row"` items with `data-testid="event-type-badge"`.
- **Recent activity**: When empty, `data-testid="no-recent-activity"` shown. When populated, `data-testid="activity-item"` items.
- **Seed data**: `admin@example.com` (Admin) and `member@example.com` (Member). Both seeded as NewMember activity items.
- **Playwright auth pattern for dashboard**: Use `secure: false` + `localStorage.setItem('stretto_user', JSON.stringify(user))` then `page.goto(UI_BASE + '/dashboard')`. Do NOT try to navigate via nav link clicks — set localStorage before navigating directly to `/dashboard`.
- **All 11 Playwright tests pass** in `e2e/dashboard-validation.spec.ts`.
- **Merge conflicts at build time**: This milestone had 4 conflicted files (UnprocessableEntityException.cs, GlobalExceptionHandlerMiddleware.cs, AuditionDatesController.cs, AuditionSlotsController.cs). Conflicts were between HEAD and a previous validator commit. Resolved by keeping HEAD versions.
>>>>>>> 083b7a8 ([validator] Validate milestone-16b: Admin Dashboard — Frontend)
=======
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)

## Milestone 15a: Notifications – Backend (Domain, Application, and Infrastructure)

Validated in milestone `milestone-15a-notifications-backend`:

- **NotificationsController added by validator**: `NotificationsController` at `api/notifications` was added to expose the notification service (the milestone implemented the service but not the controller). Registered at `src/Stretto.Api/Controllers/NotificationsController.cs`.
- **Endpoints**: `GET /api/notifications/assignment-recipients?programYearId=...` (200), `POST /api/notifications/assignment-announcement` (204), `GET /api/notifications/audition-recipients?auditionDateId=...` (200), `POST /api/notifications/audition-announcement` (204). All require Admin auth (401 without cookie, 403 for non-Admin).
- **INotificationService registered**: `builder.Services.AddScoped<INotificationService, NotificationService>()` in `Program.cs` (confirmed).
- **INotificationProvider registered**: `builder.Services.AddScoped<INotificationProvider, LogNotificationProvider>()` in `Program.cs` (confirmed).
- **LogNotificationProvider**: Logs `[NOTIFICATION] To: {to} | Subject: {subject} | Body: {body}` as Information. No actual emails sent.
- **NotificationsEnabled field**: `Member.NotificationsEnabled` defaults to `true`. `NotificationService` filters by `m.IsActive && m.NotificationsEnabled`. Note: The entity also has a pre-existing `NotificationOptOut` field (used by `MemberService`/`UpdateMemberProfileRequest`) — these are separate fields. No admin API endpoint sets `NotificationsEnabled` to `false` directly.
- **Seed data**: Login with `admin@example.com` (no password check). Member email: `member@example.com`.
- **All 9 Playwright tests pass** in `e2e/notifications-backend-validation.spec.ts`.
>>>>>>> 0865013 ([validator] Validate milestone-15a: Notifications Backend)
