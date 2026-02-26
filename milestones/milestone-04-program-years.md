## Milestone: Program Years

> **Validates:**
> - `GET /api/program-years` returns 200 with a JSON array (scoped to the authenticated org)
> - `POST /api/program-years` with `{ "name": "2026–27", "startDate": "2026-09-01", "endDate": "2027-06-30" }` returns 201 with the created program year
> - `GET /api/program-years/{id}` returns 200 for a valid id
> - `PUT /api/program-years/{id}` returns 200 with updated data
> - `POST /api/program-years/{id}/archive` returns 200 and the program year has `isArchived: true`
> - `POST /api/program-years/{id}/mark-current` returns 200 and only that program year has `isCurrent: true`
> - Admin navigating to `/program-years` sees a list page with `data-testid="program-years-list"`
> - Admin navigating to `/program-years/new` sees a create form with `data-testid="program-year-form"`
> - Admin navigating to `/program-years/{id}` sees a detail page with `data-testid="program-year-detail"`

> **Reference files:**
> - `src/Stretto.Domain/Entities/ProgramYear.cs` — existing entity (Id, Name, StartDate, EndDate, IsCurrent, IsArchived, OrganizationId)
> - `src/Stretto.Application/DTOs/AuthDtos.cs` — DTO record pattern to follow
> - `src/Stretto.Application/Services/AuthService.cs` — service pattern (constructor injection, typed exceptions)
> - `src/Stretto.Api/Controllers/AuthController.cs` — controller pattern (thin, [ApiController], [Route], return IActionResult)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic repository used via `IRepository<T>`
> - `src/Stretto.Api/Program.cs` — DI registration file to extend with new service
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — middleware to fix (add logging)
> - `src/Stretto.Application/Services/AuthService.cs` — contains ValidateAsync to fix (add IsActive check)
> - `src/Stretto.Web/src/App.tsx` — route file to extend with program year routes
> - `src/Stretto.Web/src/pages/DashboardPage.tsx` — page pattern (AppShell wrapper, data-testid on heading)

- [ ] Fix `AuthService.ValidateAsync` in `src/Stretto.Application/Services/AuthService.cs` to add `&& m.IsActive` to the `FindOneAsync` predicate so deactivated members cannot use existing sessions

- [ ] Fix `GlobalExceptionHandlerMiddleware` in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` to inject `ILogger<GlobalExceptionHandlerMiddleware>` via constructor and call `_logger.LogError(ex, "Unhandled exception")` in the catch-all block before writing the 500 response

- [ ] Create `src/Stretto.Application/DTOs/ProgramYearDtos.cs` with: `record ProgramYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsArchived)`; `record CreateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`; `record UpdateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate)`

- [ ] Create `src/Stretto.Application/Services/ProgramYearService.cs` with constructor `(IRepository<ProgramYear> repo)`; method `ListAsync(Guid orgId)` returns `List<ProgramYearDto>` ordered by StartDate descending; method `GetAsync(Guid id, Guid orgId)` throws `NotFoundException` if not found; method `CreateAsync(Guid orgId, CreateProgramYearRequest req)` validates StartDate < EndDate (throw `ValidationException("StartDate must be before EndDate")`) then adds entity with new `Guid.NewGuid()` Id; method `UpdateAsync(Guid id, Guid orgId, UpdateProgramYearRequest req)` fetches entity (throw `NotFoundException` if missing), validates dates, updates Name/StartDate/EndDate; method `ArchiveAsync(Guid id, Guid orgId)` sets `IsArchived = true`, `IsCurrent = false`; method `MarkCurrentAsync(Guid id, Guid orgId)` first lists all program years for the org and sets `IsCurrent = false` on each, then sets `IsCurrent = true` on the target (throw `NotFoundException` if target not found); all methods map entities to `ProgramYearDto` before returning

- [ ] Create `src/Stretto.Api/Controllers/ProgramYearsController.cs` with `[ApiController]`, `[Route("api/program-years")]`; constructor injects `ProgramYearService` and reads orgId from session cookie via `IAuthSessionStore`; `GET /api/program-years` → `ListAsync`, returns 200; `POST /api/program-years` → `CreateAsync`, returns 201 with `Created` location header; `GET /api/program-years/{id}` → `GetAsync`, returns 200; `PUT /api/program-years/{id}` → `UpdateAsync`, returns 200; `POST /api/program-years/{id}/archive` → `ArchiveAsync`, returns 200; `POST /api/program-years/{id}/mark-current` → `MarkCurrentAsync`, returns 200; all actions require an authenticated session (resolve orgId from session token in cookie; throw `UnauthorizedException` if token is missing or invalid)

- [ ] Register `ProgramYearService` in `src/Stretto.Api/Program.cs` with `builder.Services.AddScoped<ProgramYearService>()`

- [ ] Run `npm run generate` in `src/Stretto.Web` to regenerate the TypeScript API client from the updated OpenAPI spec into `src/api/generated/`

- [ ] Install `@tanstack/react-query` in `src/Stretto.Web` with `npm install @tanstack/react-query` and wrap the app in `QueryClientProvider` in `src/Stretto.Web/src/main.tsx`

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearsPage.tsx`; use `useQuery` to call `GET /api/program-years`; render `<AppShell>` with heading `data-testid="program-years-list"`, a "New Program Year" button linking to `/program-years/new`, and a table/list of program years showing Name, StartDate, EndDate, a "Current" badge if `isCurrent`, an "Archived" badge if `isArchived`; each row has a "View" link to `/program-years/{id}`, an "Archive" button (calls `POST /api/program-years/{id}/archive` then invalidates the query) hidden when already archived, and an "Activate" button (calls `POST /api/program-years/{id}/mark-current` then invalidates) hidden when already current or archived

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearCreatePage.tsx`; define Zod schema `z.object({ name: z.string().min(1), startDate: z.string(), endDate: z.string() })`; use `useForm` + `zodResolver`; on valid submit call `POST /api/program-years` via `useMutation`; on success navigate to `/program-years`; render `<AppShell>` with a form `data-testid="program-year-form"` containing inputs for Name, Start Date, End Date with `data-testid` attributes (`name-input`, `start-date-input`, `end-date-input`) and a Submit button

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearDetailPage.tsx`; use `useParams` to get `id`; use `useQuery` to fetch `GET /api/program-years/{id}`; render `<AppShell>` with a container `data-testid="program-year-detail"` showing Name, dates, status badges; include an inline edit form (same fields as create) pre-populated with current values using `useForm`; on submit call `PUT /api/program-years/{id}` via `useMutation` and invalidate query; show Archive / Activate action buttons consistent with the list page

- [ ] Update `src/Stretto.Web/src/App.tsx` to replace the `/program-years` `ComingSoon` route with `ProgramYearsPage`, and add new protected routes for `/program-years/new` → `ProgramYearCreatePage` and `/program-years/:id` → `ProgramYearDetailPage`
