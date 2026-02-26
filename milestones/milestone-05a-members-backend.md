## Milestone: Members — Backend API

> **Validates:**
> - `GET /health` returns HTTP 200
> - `POST /auth/login` with `{"email":"mgarner22@gmail.com"}` returns 200 with `role: "Admin"`
> - `GET /members` without a session cookie returns HTTP 401
> - `POST /auth/login` then `GET /members` with the session cookie returns HTTP 200 with a JSON array
> - `POST /members` with `{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","role":"Member"}` returns HTTP 201 with an `id` field
> - `GET /members/{id}` for the created member returns HTTP 200 with `assignments` array
> - `GET /members?search=jane` returns only members whose name or email contains "jane" (case-insensitive)
> - `DELETE /members/{id}` sets the member's `isActive` to `false`; subsequent `GET /members/{id}` returns `"isActive": false`
> - Deactivated member cannot log in: `POST /auth/login` with their email returns HTTP 401

> **Reference files:**
> - `src/Stretto.Domain/Entities/Member.cs` — entity to map (fields: Id, FirstName, LastName, Email, Role, IsActive, OrganizationId)
> - `src/Stretto.Application/Services/AuthService.cs` — pattern for service constructor injection, use of IRepository<T>, NotFoundException/ValidationException usage
> - `src/Stretto.Application/DTOs/AuthDtos.cs` — pattern for record DTOs
> - `src/Stretto.Application/Interfaces/IRepository.cs` — available repository methods (GetByIdAsync, ListAsync, FindOneAsync, AddAsync, UpdateAsync)
> - `src/Stretto.Api/Controllers/AuthController.cs` — thin controller pattern, cookie reading, IActionResult returns
> - `src/Stretto.Api/Program.cs` — DI registration pattern (AddScoped, AddSingleton, AddHttpContextAccessor)
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — exception handler to fix (finding #46)
> - `src/Stretto.Application/Services/AuthService.cs` — ValidateAsync to fix (finding #57)

- [ ] Fix `AuthService.ValidateAsync` in `src/Stretto.Application/Services/AuthService.cs`: change `FindOneAsync(m => m.Id == memberId)` to `FindOneAsync(m => m.Id == memberId && m.IsActive)` so deactivated members cannot continue to use existing session tokens (fixes finding #57)

- [ ] Fix `GlobalExceptionHandlerMiddleware` in `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: add constructor parameter `ILogger<GlobalExceptionHandlerMiddleware> logger` stored as `_logger`; in the `catch (Exception ex)` block call `_logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path)` before writing the 500 response (fixes finding #46)

- [ ] Create `src/Stretto.Application/DTOs/MemberDtos.cs` with records: `MemberDto(Guid Id, string FirstName, string LastName, string Email, string Role, bool IsActive)`, `AssignedProjectDto(Guid ProjectId, string ProjectName)`, `MemberDetailDto(Guid Id, string FirstName, string LastName, string Email, string Role, bool IsActive, IReadOnlyList<AssignedProjectDto> Assignments)`, `CreateMemberRequest(string FirstName, string LastName, string Email, string Role)`, `UpdateMemberRequest(string FirstName, string LastName, string Email, string Role)`

- [ ] Create `src/Stretto.Application/Interfaces/ICurrentUserService.cs` with `Task<AuthUserDto?> GetCurrentUserAsync()`

- [ ] Create `src/Stretto.Api/Services/CurrentUserService.cs` implementing `ICurrentUserService`; constructor takes `IHttpContextAccessor httpContextAccessor` and `AuthService authService`; `GetCurrentUserAsync()` reads `stretto_session` cookie from `httpContextAccessor.HttpContext?.Request.Cookies`; if null returns null; calls `authService.ValidateAsync(token)` in a try/catch and returns the dto on success or null on `UnauthorizedException`

- [ ] Register services in `src/Stretto.Api/Program.cs`: add `builder.Services.AddHttpContextAccessor()`; add `builder.Services.AddScoped<ICurrentUserService, CurrentUserService>()` (using `Stretto.Api.Services` and `Stretto.Application.Interfaces` namespaces)

- [ ] Create `src/Stretto.Application/Services/MemberService.cs`; constructor takes `IRepository<Member> members`, `IRepository<ProjectAssignment> assignments`, `IRepository<Project> projects`; implement `ListAsync(Guid orgId, string? search)` → calls `_members.ListAsync(orgId)`, filters case-insensitively on `FirstName`, `LastName`, `Email` if search is non-empty, returns `List<MemberDto>`; implement `GetByIdAsync(Guid id, Guid orgId)` → calls `_members.GetByIdAsync(id, orgId)`, throws `NotFoundException("Member not found")` if null, loads assignments via `_assignments.ListAsync(orgId, a => a.MemberId == id)`, resolves project names via `_projects.GetByIdAsync(projectId, orgId)` for each assignment, returns `MemberDetailDto`

- [ ] Add `CreateAsync(Guid orgId, CreateMemberRequest req)` to `MemberService`: validate `req.Role` parses to `Role` enum (throw `ValidationException` with `{ "role": "Invalid role value" }` if not); check uniqueness — `_members.FindOneAsync(m => m.Email == req.Email && m.OrganizationId == orgId)` throws `ValidationException` with `{ "email": "Email is already in use" }` if found; create `new Member { Id = Guid.NewGuid(), FirstName = req.FirstName, LastName = req.LastName, Email = req.Email, Role = parsedRole, IsActive = true, OrganizationId = orgId }`; call `_members.AddAsync(member)`; return `MemberDto`

- [ ] Add `UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req)` and `DeactivateAsync(Guid id, Guid orgId)` to `MemberService`: `UpdateAsync` loads member via `GetByIdAsync`, validates role enum, updates `FirstName`, `LastName`, `Email`, `Role`, calls `UpdateAsync`; `DeactivateAsync` loads member via `GetByIdAsync`, sets `IsActive = false`, calls `UpdateAsync`; both return `MemberDto`

- [ ] Register `MemberService` as scoped in `src/Stretto.Api/Program.cs`: `builder.Services.AddScoped<MemberService>()`

- [ ] Create `src/Stretto.Api/Controllers/MembersController.cs` with `[ApiController, Route("members")]`; constructor takes `MemberService memberService` and `ICurrentUserService currentUser`; add private helper `async Task<Guid> GetOrgIdAsync()` that calls `currentUser.GetCurrentUserAsync()` and throws `UnauthorizedException()` if null, returns `dto.OrgId`; implement: `[HttpGet] GET /members?search=` calling `memberService.ListAsync(orgId, search)` → `Ok(result)`; `[HttpGet("{id}")] GET /members/{id}` → `Ok(result)`; `[HttpPost] POST /members` → `Created($"/members/{result.Id}", result)`; `[HttpPut("{id}")] PUT /members/{id}` → `Ok(result)`; `[HttpDelete("{id}")] DELETE /members/{id}` → `NoContent()`
