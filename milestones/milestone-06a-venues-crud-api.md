## Milestone: Venues — CRUD API

> **Validates:**
> - `GET /api/venues` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`, then `POST /api/venues` with body `{"name":"City Hall","address":"1 Main St","contactName":"Bob","contactEmail":"bob@example.com","contactPhone":"555-1234"}` returns HTTP 201 with a JSON body containing `id`, `name`, `address`
> - `GET /api/venues/{id}` with the id from the previous response returns HTTP 200 with matching `name` field
> - `PUT /api/venues/{id}` with updated name returns HTTP 200 with updated `name`
> - `DELETE /api/venues/{id}` returns HTTP 204; subsequent `GET /api/venues/{id}` returns HTTP 404
> - `GET /api/venues` returns HTTP 200 with a JSON array

> **Reference files:**
> - `src/Stretto.Domain/Entities/Venue.cs` — Venue entity (already defined; no changes needed)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic base repository; use `IRepository<Venue>` directly, no separate Venue repository needed
> - `src/Stretto.Application/Services/AuthService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTOs
> - `src/Stretto.Api/Controllers/AuthController.cs` — pattern for thin controller: inject service, read session cookie, delegate to service, return HTTP result
> - `src/Stretto.Api/Program.cs` — add `AddScoped<VenueService>()` here

- [x] Fix `GlobalExceptionHandlerMiddleware` catch-all in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: inject `ILogger<GlobalExceptionHandlerMiddleware>` via constructor; in the `catch (Exception ex)` block call `_logger.LogError(ex, "Unhandled exception")` before writing the 500 response (addresses finding #46)

- [x] Fix `AuthService.ValidateAsync` in `src/Stretto.Application/Services/AuthService.cs`: after fetching the member by id, add `if (member is null || !member.IsActive) throw new UnauthorizedException();` — replacing the existing null-only check — so deactivated members cannot use existing session tokens (addresses findings #57 and #59)

- [x] Add session expiry to `InMemoryAuthSessionStore` in `src/Stretto.Infrastructure/Auth/InMemoryAuthSessionStore.cs`: store a `ConcurrentDictionary<string, (Guid memberId, DateTime expiresAt)>` instead of `ConcurrentDictionary<string, Guid>`; set expiry to `DateTime.UtcNow.AddHours(8)` in `CreateSession`; in `GetMemberId` return null if `DateTime.UtcNow > expiresAt` (addresses finding #60)

- [x] Create `src/Stretto.Application/DTOs/VenueDtos.cs` with two records: `VenueDto(Guid Id, string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone)` and `SaveVenueRequest(string Name, string Address, string? ContactName, string? ContactEmail, string? ContactPhone)`

- [x] Create `src/Stretto.Application/Services/VenueService.cs`; constructor-inject `IRepository<Venue>`; implement five methods: `ListAsync(Guid orgId)` returning `List<VenueDto>`; `GetAsync(Guid id, Guid orgId)` returning `VenueDto` (throw `NotFoundException("Venue not found")` if null); `CreateAsync(Guid orgId, SaveVenueRequest req)` that builds a new `Venue` with a `Guid.NewGuid()` id and the provided fields plus `OrganizationId = orgId`, calls `AddAsync`, returns the new `VenueDto`; `UpdateAsync(Guid id, Guid orgId, SaveVenueRequest req)` that fetches, sets fields, calls `UpdateAsync`, returns updated `VenueDto`; `DeleteAsync(Guid id, Guid orgId)` that fetches (throw `NotFoundException` if null), calls `DeleteAsync`

- [ ] Register `VenueService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<VenueService>();` after the existing `AddScoped<AuthService>()` line

- [ ] Create `src/Stretto.Api/Controllers/VenuesController.cs` with `[ApiController]`, `[Route("api/venues")]`; constructor-inject `VenueService` and `AuthService`; add private async helper `GetOrgIdAsync()` that reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if null, calls `AuthService.ValidateAsync(token)`, and returns `dto.OrgId`; implement: `GET /api/venues` → calls `GetOrgIdAsync()` then `VenueService.ListAsync(orgId)`, returns `Ok(list)`; `GET /api/venues/{id}` → returns `Ok(dto)` or propagates `NotFoundException`; `POST /api/venues` → creates venue, returns `Created($"/api/venues/{dto.Id}", dto)`; `PUT /api/venues/{id}` → returns `Ok(dto)`; `DELETE /api/venues/{id}` → returns `NoContent()`
