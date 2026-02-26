## Milestone: Authentication — Backend

> **Validates:**
> - `POST /auth/login` with body `{"email":"mgarner22@gmail.com"}` returns HTTP 200 with JSON body containing `id`, `email`, `firstName`, `lastName`, `role`, `orgId`, `orgName` and sets a `stretto_session` cookie
> - `POST /auth/login` with an unknown email returns HTTP 401 with JSON `{"message":"..."}`
> - `GET /auth/validate` with the `stretto_session` cookie from login returns HTTP 200 with the same user JSON
> - `GET /auth/validate` with no cookie returns HTTP 401
> - `POST /auth/logout` with the cookie returns HTTP 204 and the cookie is cleared
> - `GET /health` still returns HTTP 200 with `{"status":"healthy"}`

> **Reference files:**
> - `src/Stretto.Api/Program.cs` — DI registration and middleware pipeline to follow for adding controllers, session store, and cookie policy
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — pattern for adding new exception → HTTP status mapping
> - `src/Stretto.Application/Interfaces/IRepository.cs` — interface pattern to follow for `IAuthSessionStore`
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — implementation pattern to follow for `InMemoryAuthSessionStore`
> - `src/Stretto.Infrastructure/Data/DataSeeder.cs` — shows seeded org and member data the auth service queries

- [x] Add `UnauthorizedException` in `Stretto.Application/Exceptions/UnauthorizedException.cs` with constructor `UnauthorizedException(string message = "Unauthorized")` extending `Exception`; update `GlobalExceptionHandlerMiddleware` to catch `UnauthorizedException` before the generic `Exception` catch and write a 401 JSON response `{"message":"..."}` with `Content-Type: application/json`

- [x] Add `FindOneAsync(Expression<Func<T, bool>> predicate)` to `IRepository<T>` in `Stretto.Application/Interfaces/IRepository.cs`; implement it in `BaseRepository<T>` in `Stretto.Infrastructure/Repositories/BaseRepository.cs` returning `await _context.Set<T>().Where(predicate).FirstOrDefaultAsync()`; this method does NOT apply org-scoping (used for email lookups during auth)

- [x] Create `IAuthSessionStore` interface in `Stretto.Application/Interfaces/IAuthSessionStore.cs` with three methods: `string CreateSession(Guid memberId)`, `Guid? GetMemberId(string token)`, `void DeleteSession(string token)`

- [x] Create `InMemoryAuthSessionStore` in `Stretto.Infrastructure/Auth/InMemoryAuthSessionStore.cs` implementing `IAuthSessionStore`; use `ConcurrentDictionary<string, Guid>` as backing store; `CreateSession` generates a token via `Guid.NewGuid().ToString("N")`, stores `{token → memberId}`, returns the token; `GetMemberId` returns the value or `null` if absent; `DeleteSession` removes the key

- [x] Create auth DTOs as records in `Stretto.Application/DTOs/AuthDtos.cs`: `LoginRequest(string Email)` and `AuthUserDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid OrgId, string OrgName)`

- [x] Create `AuthService` in `Stretto.Application/Services/AuthService.cs`; constructor takes `IRepository<Member> members`, `IRepository<Organization> orgs`, `IAuthSessionStore sessions`; `LoginAsync(LoginRequest req)` calls `members.FindOneAsync(m => m.Email == req.Email && m.IsActive)`, throws `UnauthorizedException("Invalid email or account is inactive")` if null, calls `orgs.FindOneAsync(o => o.Id == member.OrganizationId)` to get org name, calls `sessions.CreateSession(member.Id)`, returns `(AuthUserDto dto, string token)`; `ValidateAsync(string token)` calls `sessions.GetMemberId(token)`, throws `UnauthorizedException` if null, fetches member and org, returns `AuthUserDto`; `LogoutAsync(string token)` calls `sessions.DeleteSession(token)` (no-op if token is not found)

- [x] Create `AuthController` in `Stretto.Api/Controllers/AuthController.cs`; add `[ApiController]` and `[Route("auth")]` attributes; constructor takes `AuthService`; `POST /auth/login` accepts `[FromBody] LoginRequest`, calls `LoginAsync`, appends cookie `stretto_session` with options `HttpOnly=true, Secure=true, SameSite=SameSiteMode.Strict, Path="/"`, returns `Ok(dto)`; `GET /auth/validate` reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if missing, calls `ValidateAsync`, returns `Ok(dto)`; `POST /auth/logout` reads cookie, calls `LogoutAsync`, appends an expired replacement cookie to clear it (`Expires = DateTimeOffset.UtcNow.AddDays(-1)`), returns `NoContent()`

- [ ] Update `Stretto.Api/Program.cs`: add `builder.Services.AddControllers()`; add `builder.Services.AddSingleton<IAuthSessionStore, InMemoryAuthSessionStore>()`; add `builder.Services.AddScoped<AuthService>()`; call `app.MapControllers()` after the health endpoint; add the required `using` statements for the new namespaces (`Stretto.Application.Services`, `Stretto.Application.Interfaces`, `Stretto.Infrastructure.Auth`)
