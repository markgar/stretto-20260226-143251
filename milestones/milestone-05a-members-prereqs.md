## Milestone: Members — Prerequisites & Shared Infrastructure

> **Validates:**
> - `GET /api/members` without a session cookie returns HTTP 401
> - `POST /api/auth/login` with `admin@example.com`, then `GET /api/members` returns HTTP 200 with a JSON array
> - `POST /api/auth/login` with `member@example.com`, then `POST /api/members` returns HTTP 403

> **Reference files:**
> - `src/Stretto.Infrastructure/Data/DataSeeder.cs` — seed data; update emails to match expected test values
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — global exception handler; add ForbiddenException mapping here
> - `src/Stretto.Api/Controllers/VenuesController.cs` — pattern for admin-only actions using `GetOrgIdAsAdminAsync()`

- [ ] Fix `DataSeeder` seed emails in `src/Stretto.Infrastructure/Data/DataSeeder.cs`: change the admin member's `Email` from `"mgarner22@gmail.com"` to `"admin@example.com"` and the member's `Email` from `"mgarner@outlook.com"` to `"member@example.com"` (addresses finding #83)

- [ ] Fix test compile error in `tests/Stretto.Api.Tests/GlobalExceptionHandlerMiddlewareTests.cs`: find the `UnauthorizedException_returns_401_with_message_body` test that constructs `new GlobalExceptionHandlerMiddleware(next)` with only one argument; add `Microsoft.Extensions.Logging.Abstractions.NullLogger<GlobalExceptionHandlerMiddleware>.Instance` as the second argument so the call matches the updated two-argument constructor (addresses finding #82)

- [ ] Create `src/Stretto.Application/Exceptions/ForbiddenException.cs`: a class inheriting from `Exception` with a no-arg constructor that calls `base("Forbidden")` and a single-string constructor that calls `base(message)`

- [ ] Add 403 handler to `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs`: inside `InvokeAsync`, add a `catch (ForbiddenException ex)` block before the generic `catch (Exception ex)` block; set `context.Response.StatusCode = 403`, `ContentType = "application/json"`, and write `JsonSerializer.Serialize(new { message = ex.Message })`; add `using Stretto.Application.Exceptions;` if not already present

- [ ] Add `GetOrgIdAsAdminAsync()` helper to `src/Stretto.Api/Controllers/VenuesController.cs`: copy the existing `GetOrgIdAsync()` body; after `var dto = await _authService.ValidateAsync(token);` add `if (dto.Role != "Admin") throw new ForbiddenException();`; replace calls in `Create`, `Update`, and `Delete` actions with `GetOrgIdAsAdminAsync()` (addresses finding #75)
