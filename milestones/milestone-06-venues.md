## Milestone: Venues — CRUD API + Admin Pages

> **Validates:**
> - `GET /api/venues` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`, then `POST /api/venues` with body `{"name":"City Hall","address":"1 Main St","contactName":"Bob","contactEmail":"bob@example.com","contactPhone":"555-1234"}` returns HTTP 201 with a JSON body containing `id`, `name`, `address`
> - `GET /api/venues/{id}` with the id from the previous response returns HTTP 200 with matching `name` field
> - `PUT /api/venues/{id}` with updated name returns HTTP 200 with updated `name`
> - `DELETE /api/venues/{id}` returns HTTP 204; subsequent `GET /api/venues/{id}` returns HTTP 404
> - `GET /api/venues` returns HTTP 200 with a JSON array
> - Frontend `/venues` (authenticated) renders an element with `data-testid="venues-heading"`
> - Frontend `/venues/new` renders an input with `data-testid="name-input"` and a button with `data-testid="submit-button"`

> **Reference files:**
> - `src/Stretto.Domain/Entities/Venue.cs` — Venue entity (already defined; no changes needed)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic base repository; use `IRepository<Venue>` directly, no separate Venue repository needed
> - `src/Stretto.Application/Services/AuthService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTOs
> - `src/Stretto.Api/Controllers/AuthController.cs` — pattern for thin controller: inject service, read session cookie, delegate to service, return HTTP result
> - `src/Stretto.Web/src/pages/LoginPage.tsx` — pattern for a page using React Hook Form + Zod + navigation
> - `src/Stretto.Api/Program.cs` — add `AddScoped<VenueService>()` here
> - `src/Stretto.Web/src/App.tsx` — replace `/venues` placeholder and add `/venues/new` and `/venues/:id/edit` routes here

- [ ] Fix `GlobalExceptionHandlerMiddleware` catch-all in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: inject `ILogger<GlobalExceptionHandlerMiddleware>` via constructor; in the `catch (Exception ex)` block call `_logger.LogError(ex, "Unhandled exception")` before writing the 500 response (addresses finding #46)

- [ ] Fix `AuthService.ValidateAsync` in `src/Stretto.Application/Services/AuthService.cs`: after fetching the member by id, add `if (member is null || !member.IsActive) throw new UnauthorizedException();` — replacing the existing null-only check — so deactivated members cannot use existing session tokens (addresses findings #57 and #59)

- [ ] Add session expiry to `InMemoryAuthSessionStore` in `src/Stretto.Infrastructure/Auth/InMemoryAuthSessionStore.cs`: store a `ConcurrentDictionary<string, (Guid memberId, DateTime expiresAt)>` instead of `ConcurrentDictionary<string, Guid>`; set expiry to `DateTime.UtcNow.AddHours(8)` in `CreateSession`; in `GetMemberId` return null if `DateTime.UtcNow > expiresAt` (addresses finding #60)

- [ ] Create `src/Stretto.Application/DTOs/VenueDtos.cs` with two records: `VenueDto(Guid Id, string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone)` and `SaveVenueRequest(string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone)`

- [ ] Create `src/Stretto.Application/Services/VenueService.cs`; constructor-inject `IRepository<Venue>`; implement five methods: `ListAsync(Guid orgId)` returning `List<VenueDto>`; `GetAsync(Guid id, Guid orgId)` returning `VenueDto` (throw `NotFoundException("Venue not found")` if null); `CreateAsync(Guid orgId, SaveVenueRequest req)` that builds a new `Venue` with a `Guid.NewGuid()` id and the provided fields plus `OrganizationId = orgId`, calls `AddAsync`, returns the new `VenueDto`; `UpdateAsync(Guid id, Guid orgId, SaveVenueRequest req)` that fetches, sets fields, calls `UpdateAsync`, returns updated `VenueDto`; `DeleteAsync(Guid id, Guid orgId)` that fetches (throw `NotFoundException` if null), calls `DeleteAsync`

- [ ] Register `VenueService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<VenueService>();` after the existing `AddScoped<AuthService>()` line

- [ ] Create `src/Stretto.Api/Controllers/VenuesController.cs` with `[ApiController]`, `[Route("api/venues")]`; constructor-inject `VenueService` and `AuthService`; add private async helper `GetOrgIdAsync()` that reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if null, calls `AuthService.ValidateAsync(token)`, and returns `dto.OrgId`; implement: `GET /api/venues` → calls `GetOrgIdAsync()` then `VenueService.ListAsync(orgId)`, returns `Ok(list)`; `GET /api/venues/{id}` → returns `Ok(dto)` or propagates `NotFoundException`; `POST /api/venues` → creates venue, returns `Created($"/api/venues/{dto.Id}", dto)`; `PUT /api/venues/{id}` → returns `Ok(dto)`; `DELETE /api/venues/{id}` → returns `NoContent()`

- [ ] Install `@tanstack/react-query` in `src/Stretto.Web`: run `npm install @tanstack/react-query` from the `src/Stretto.Web/` directory

- [ ] Update `src/Stretto.Web/src/main.tsx` to set up Tanstack Query: import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`; create `const queryClient = new QueryClient()` above the render call; wrap `<BrowserRouter><App /></BrowserRouter>` in `<QueryClientProvider client={queryClient}>...</QueryClientProvider>`

- [ ] Regenerate the TypeScript API client: start the backend with `dotnet run --project src/Stretto.Api/` so Swagger is available at `http://localhost:5000/swagger/v1/swagger.json`, then run `npm run generate` from `src/Stretto.Web/`; commit the generated files in `src/Stretto.Web/src/api/generated/`

- [ ] Create `src/Stretto.Web/src/pages/VenuesListPage.tsx`; import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`; import `AppShell` and `Link` from react-router-dom; use `useAuthStore` to get the current user; `useQuery({ queryKey: ['venues'], queryFn: () => fetch('/api/venues', { credentials: 'include' }).then(r => r.json()) })`; render inside `<AppShell>`: heading `<h1 data-testid="venues-heading">Venues</h1>`, an `<Link to="/venues/new" data-testid="add-venue-button">Add Venue</Link>` button, and a `<table>` with columns Name, Address, Contact (shows ContactName / ContactEmail / ContactPhone joined), and Actions; each row action cell has an `<Link to={`/venues/${v.id}/edit`} data-testid={`edit-venue-${v.id}`}>Edit</Link>` and a `<button data-testid={`delete-venue-${v.id}`}>Delete</button>` that calls a `useMutation` wrapping `fetch(`/api/venues/${v.id}`, { method: 'DELETE', credentials: 'include' })` with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues'] })`

- [ ] Create `src/Stretto.Web/src/pages/VenueFormPage.tsx`; import `useParams`, `useNavigate` from react-router-dom; import `useQuery`, `useMutation` from `@tanstack/react-query`; import `useForm` and `zodResolver`; define Zod schema `z.object({ name: z.string().min(1, 'Name is required'), address: z.string().min(1, 'Address is required'), contactName: z.string().optional(), contactEmail: z.string().email('Invalid email').optional().or(z.literal('')), contactPhone: z.string().optional() })`; derive type with `z.infer`; read `id` from `useParams()`; if `id` is present, `useQuery` to `GET /api/venues/:id` and call `reset(data)` when data loads; on form submit call POST `/api/venues` or PUT `/api/venues/:id` via `useMutation` and navigate to `/venues` on success; render a form with labeled inputs: `<input data-testid="name-input" />`, `<input data-testid="address-input" />`, `<input data-testid="contact-name-input" />`, `<input data-testid="contact-email-input" />`, `<input data-testid="contact-phone-input" />`, and `<button type="submit" data-testid="submit-button">Save Venue</button>`; show inline error messages from formState.errors below each field

- [ ] Update `src/Stretto.Web/src/App.tsx`: import `VenuesListPage` and `VenueFormPage`; replace `<Route path="/venues" element={<ComingSoon />} />` with `<Route path="/venues" element={<VenuesListPage />} />`; add inside the `<Route element={<ProtectedRoute />}>` block: `<Route path="/venues/new" element={<VenueFormPage />} />` and `<Route path="/venues/:id/edit" element={<VenueFormPage />} />`
