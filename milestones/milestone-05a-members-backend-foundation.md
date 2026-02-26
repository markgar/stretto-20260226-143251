## Milestone: Members — Backend Foundation

> **Validates:**
> - `GET /health` returns HTTP 200
> - `POST /auth/login` with `{"email":"mgarner22@gmail.com"}` returns 200 with `role: "Admin"`
> - `GET /members` without a session cookie returns HTTP 401
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
