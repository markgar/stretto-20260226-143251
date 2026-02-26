## Milestone: Members — CRUD API

> **Validates:**
> - `GET /api/members` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `mgarner22@gmail.com`, then `GET /api/members` returns HTTP 200 with a JSON array containing at least one member object with fields `id`, `firstName`, `lastName`, `email`, `role`, `isActive`
> - `POST /api/members` with body `{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","role":"Member"}` returns HTTP 201 with matching fields
> - `GET /api/members/{id}` with the id from the previous response returns HTTP 200 with matching `firstName` and `email` fields
> - `GET /api/members?search=jane` returns HTTP 200 with a JSON array filtered to members whose name or email contains "jane" (case-insensitive)
> - `PUT /api/members/{id}` with body `{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","role":"Member","isActive":true}` returns HTTP 200 with updated `lastName`
> - `DELETE /api/members/{id}` returns HTTP 200 with `isActive` set to `false` (deactivate, not hard delete)
> - `POST /api/members` authenticated as non-admin member (`mgarner@outlook.com`) returns HTTP 403
> - `GET /health` returns HTTP 200

> **Reference files:**
> - `src/Stretto.Domain/Entities/Member.cs` — Member entity (already defined; no new entity needed)
> - `src/Stretto.Infrastructure/Data/Configurations/MemberConfiguration.cs` — EF Fluent config (already defined)
> - `src/Stretto.Application/Services/VenueService.cs` — pattern for Application-layer service: constructor-inject `IRepository<T>`, throw typed exceptions, return DTO records
> - `src/Stretto.Api/Controllers/VenuesController.cs` — pattern for thin controller: read session cookie, delegate to service, return HTTP result
> - `src/Stretto.Api/Program.cs` — add `AddScoped<MemberService>()` here

- [ ] Create `src/Stretto.Application/Exceptions/ForbiddenException.cs`: `public class ForbiddenException : Exception { public ForbiddenException() : base("Forbidden") { } public ForbiddenException(string message) : base(message) { } }`

- [ ] Add HTTP 403 mapping for `ForbiddenException` in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: add a `catch (ForbiddenException ex)` block before the `catch (Exception ex)` block that sets `context.Response.StatusCode = 403`, sets `ContentType = "application/json"`, and writes `JsonSerializer.Serialize(new { message = ex.Message })`

- [ ] Create `src/Stretto.Application/DTOs/MemberDtos.cs` with three records: `MemberDto(Guid Id, string FirstName, string LastName, string Email, string Role, bool IsActive)`; `CreateMemberRequest(string FirstName, string LastName, string Email, string Role)`; `UpdateMemberRequest(string FirstName, string LastName, string Email, string Role, bool IsActive)`

- [ ] Create `src/Stretto.Application/Services/MemberService.cs`; constructor-inject `IRepository<Member>`; implement five methods: `ListAsync(Guid orgId, string? search)` that calls `_members.ListAsync(orgId)` then filters in-memory where `search` is non-null/non-empty using `m.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) || m.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) || m.Email.Contains(search, StringComparison.OrdinalIgnoreCase)`, returns `List<MemberDto>`; `GetAsync(Guid id, Guid orgId)` returns `MemberDto` or throws `NotFoundException("Member not found")`; `CreateAsync(Guid orgId, CreateMemberRequest req)` that builds a new `Member` with `Guid.NewGuid()` id, sets `OrganizationId = orgId`, `FirstName`, `LastName`, `Email`, `Role = Enum.Parse<Role>(req.Role)`, `IsActive = true`, calls `AddAsync`, returns new `MemberDto`; `UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req)` that fetches (throws `NotFoundException` if null), sets all fields from request, calls `UpdateAsync`, returns updated `MemberDto`; `DeactivateAsync(Guid id, Guid orgId)` that fetches (throws `NotFoundException` if null), sets `IsActive = false`, calls `UpdateAsync`, returns updated `MemberDto`

- [ ] Register `MemberService` in `src/Stretto.Api/Program.cs`: add `builder.Services.AddScoped<MemberService>();` after the existing `AddScoped<VenueService>()` line

- [ ] Create `src/Stretto.Api/Controllers/MembersController.cs` with `[ApiController]`, `[Route("api/members")]`; constructor-inject `MemberService` and `AuthService`; add private async helper `GetAuthUserAsync()` that reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if null, calls `_authService.ValidateAsync(token)`, and returns the `AuthUserDto`; add private static helper `RequireAdmin(AuthUserDto user)` that throws `ForbiddenException()` if `user.Role != "Admin"`; implement: `GET /api/members` (optional `[FromQuery] string? search` parameter) → calls `GetAuthUserAsync()` then `MemberService.ListAsync(user.OrgId, search)`, returns `Ok(list)`; `GET /api/members/{id}` → calls `GetAuthUserAsync()` then `MemberService.GetAsync(id, user.OrgId)`, returns `Ok(dto)`; `POST /api/members` → calls `GetAuthUserAsync()`, calls `RequireAdmin(user)`, calls `MemberService.CreateAsync(user.OrgId, req)`, returns `Created($"/api/members/{dto.Id}", dto)`; `PUT /api/members/{id}` → calls `GetAuthUserAsync()`, calls `RequireAdmin(user)`, calls `MemberService.UpdateAsync(id, user.OrgId, req)`, returns `Ok(dto)`; `DELETE /api/members/{id}` → calls `GetAuthUserAsync()`, calls `RequireAdmin(user)`, calls `MemberService.DeactivateAsync(id, user.OrgId)`, returns `Ok(dto)`

- [ ] Re-generate the TypeScript API client: run `npm run generate` inside `src/Stretto.Web/` (this requires the API to be running; use `dotnet run --project src/Stretto.Api` in the background, wait for startup, run generate, then stop the server); commit the updated files in `src/Stretto.Web/src/api/generated/`
