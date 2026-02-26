## Milestone: Members — CRUD API

> **Validates:**
> - `GET /api/members` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `admin@example.com`, then `GET /api/members` returns HTTP 200 with a JSON array
> - `POST /api/members` with body `{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","role":"Member"}` returns HTTP 201 with a JSON body containing `id`, `firstName`, `lastName`, `email`, `isActive: true`
> - `GET /api/members/{id}` with the id from the previous response returns HTTP 200 with matching `email` field
> - `PUT /api/members/{id}` with updated `firstName` returns HTTP 200 with updated `firstName`
> - `DELETE /api/members/{id}` returns HTTP 200; subsequent `GET /api/members/{id}` returns HTTP 200 with `isActive: false`
> - `GET /api/members?search=jane` returns HTTP 200 with an array including the member with `email: "jane@example.com"`
> - `POST /api/auth/login` with `member@example.com`, then `POST /api/members` returns HTTP 403

> **Reference files:**
> - `src/Stretto.Domain/Entities/Member.cs` — Member entity (already defined; fields: Id, FirstName, LastName, Email, Role, IsActive, OrganizationId)
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — generic base repository; use `IRepository<Member>` directly, no separate Member repository needed; `ListAsync(orgId, predicate?)` supports optional filter
> - `src/Stretto.Application/Services/VenueService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTOs
> - `src/Stretto.Api/Controllers/VenuesController.cs` — pattern for thin controller: inject service, read session cookie, delegate to service, return HTTP result
> - `src/Stretto.Api/Program.cs` — add `AddScoped<MemberService>()` here

- [ ] Fix `DataSeeder` seed emails in `src/Stretto.Infrastructure/Data/DataSeeder.cs`: change the admin member's `Email` from `"mgarner22@gmail.com"` to `"admin@example.com"` and the member's `Email` from `"mgarner@outlook.com"` to `"member@example.com"` (addresses finding #83)

- [ ] Fix test compile error in `tests/Stretto.Api.Tests/GlobalExceptionHandlerMiddlewareTests.cs`: find the `UnauthorizedException_returns_401_with_message_body` test that constructs `new GlobalExceptionHandlerMiddleware(next)` with only one argument; add `Microsoft.Extensions.Logging.Abstractions.NullLogger<GlobalExceptionHandlerMiddleware>.Instance` as the second argument so the call matches the updated two-argument constructor (addresses finding #82)

- [ ] Create `src/Stretto.Application/Exceptions/ForbiddenException.cs`: a class inheriting from `Exception` with a no-arg constructor that calls `base("Forbidden")` and a single-string constructor that calls `base(message)`

- [ ] Add 403 handler to `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: inside `InvokeAsync`, add a `catch (ForbiddenException ex)` block before the generic `catch (Exception ex)` block; set `context.Response.StatusCode = 403`, `ContentType = "application/json"`, and write `JsonSerializer.Serialize(new { message = ex.Message })`; add `using Stretto.Application.Exceptions;` if not already present

- [ ] Add `GetOrgIdAsAdminAsync()` helper to `src/Stretto.Api/Controllers/VenuesController.cs`: copy the existing `GetOrgIdAsync()` body; after `var dto = await _authService.ValidateAsync(token);` add `if (dto.Role != "Admin") throw new ForbiddenException();`; replace calls in `Create`, `Update`, and `Delete` actions with `GetOrgIdAsAdminAsync()` (addresses finding #75)

- [ ] Create `src/Stretto.Application/DTOs/MemberDtos.cs` with three records: `MemberDto(Guid Id, string FirstName, string LastName, string Email, string Role, bool IsActive, Guid OrganizationId)`; `CreateMemberRequest(string FirstName, string LastName, string Email, string Role)`; `UpdateMemberRequest(string FirstName, string LastName, string Email, string Role)`

- [ ] Create `src/Stretto.Application/Services/MemberService.cs`; constructor-inject `IRepository<Member>`; implement five methods: `ListAsync(Guid orgId, string? search)` that calls `_members.ListAsync(orgId, m => search == null || m.FirstName.Contains(search) || m.LastName.Contains(search) || m.Email.Contains(search))` and maps results to `List<MemberDto>`; `GetAsync(Guid id, Guid orgId)` that fetches by id and org (throw `NotFoundException("Member not found")` if null), returns `MemberDto`; `CreateAsync(Guid orgId, CreateMemberRequest req)` that parses `req.Role` to `Role` enum (throw `ValidationException` with `errors: { "role": "Invalid role" }` if parse fails), creates a `Member` with `Guid.NewGuid()` id, `IsActive = true`, all request fields, calls `AddAsync`, returns `MemberDto`; `UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req)` that fetches, updates fields (parse role same as create), calls `UpdateAsync`, returns updated `MemberDto`; `DeactivateAsync(Guid id, Guid orgId)` that fetches (throw `NotFoundException` if null), sets `IsActive = false`, calls `UpdateAsync`; add private static `MemberDto ToDto(Member m)` helper

- [ ] Register `MemberService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<MemberService>();` after the existing `AddScoped<VenueService>()` line

- [ ] Create `src/Stretto.Api/Controllers/MembersController.cs` with `[ApiController]`, `[Route("api/members")]`; constructor-inject `MemberService` and `AuthService`; add private async helpers: `GetOrgIdAsync()` that reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if null, calls `_authService.ValidateAsync(token)`, returns `dto.OrgId`; `GetOrgIdAsAdminAsync()` that does the same but additionally throws `ForbiddenException` if `dto.Role != "Admin"`; implement endpoints: `GET /api/members` with optional `[FromQuery] string? search` → calls `GetOrgIdAsync()` then `MemberService.ListAsync(orgId, search)`, returns `Ok(list)`; `GET /api/members/{id:guid}` → returns `Ok(dto)` or propagates `NotFoundException`; `POST /api/members` with `[FromBody] CreateMemberRequest req` → calls `GetOrgIdAsAdminAsync()`, creates member, returns `Created($"/api/members/{dto.Id}", dto)`; `PUT /api/members/{id:guid}` with `[FromBody] UpdateMemberRequest req` → calls `GetOrgIdAsAdminAsync()`, updates member, returns `Ok(dto)`; `DELETE /api/members/{id:guid}` → calls `GetOrgIdAsAdminAsync()`, deactivates member, returns `Ok(new { message = "Member deactivated" })`
