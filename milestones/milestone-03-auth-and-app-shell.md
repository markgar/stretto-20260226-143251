## Milestone: Authentication + App Shell

> **Validates:**
> - `POST /auth/login` with body `{"email":"mgarner22@gmail.com"}` returns HTTP 200 with JSON body containing `id`, `email`, `firstName`, `lastName`, `role`, `orgId`, `orgName` and sets a `stretto_session` cookie
> - `POST /auth/login` with an unknown email returns HTTP 401 with JSON `{"message":"..."}`
> - `GET /auth/validate` with the `stretto_session` cookie from login returns HTTP 200 with the same user JSON
> - `GET /auth/validate` with no cookie returns HTTP 401
> - `POST /auth/logout` with the cookie returns HTTP 204 and the cookie is cleared
> - `GET /health` still returns HTTP 200 with `{"status":"healthy"}`
> - Frontend at `/login` renders an email input (`data-testid="email-input"`) and a submit button (`data-testid="login-button"`)
> - Submitting the login form with `mgarner22@gmail.com` redirects to `/dashboard` and renders a heading with `data-testid="dashboard-heading"`
> - Navigating directly to `/dashboard` without being logged in redirects to `/login`

> **Reference files:**
> - `src/Stretto.Api/Program.cs` — DI registration and middleware pipeline to follow for adding controllers, session store, and cookie policy
> - `src/Stretto.Api/Middleware/GlobalExceptionHandlerMiddleware.cs` — pattern for adding new exception → HTTP status mapping
> - `src/Stretto.Application/Interfaces/IRepository.cs` — interface pattern to follow for `IAuthSessionStore`
> - `src/Stretto.Infrastructure/Repositories/BaseRepository.cs` — implementation pattern to follow for `InMemoryAuthSessionStore`
> - `src/Stretto.Infrastructure/Data/DataSeeder.cs` — shows seeded org and member data the auth service queries
> - `src/Stretto.Web/src/App.tsx` — root route file to update with login/dashboard routes
> - `src/Stretto.Web/src/lib/utils.ts` — `cn` helper to use in new components

- [ ] Add `UnauthorizedException` in `Stretto.Application/Exceptions/UnauthorizedException.cs` with constructor `UnauthorizedException(string message = "Unauthorized")` extending `Exception`; update `GlobalExceptionHandlerMiddleware` to catch `UnauthorizedException` before the generic `Exception` catch and write a 401 JSON response `{"message":"..."}` with `Content-Type: application/json`

- [ ] Add `FindOneAsync(Expression<Func<T, bool>> predicate)` to `IRepository<T>` in `Stretto.Application/Interfaces/IRepository.cs`; implement it in `BaseRepository<T>` in `Stretto.Infrastructure/Repositories/BaseRepository.cs` returning `await _context.Set<T>().Where(predicate).FirstOrDefaultAsync()`; this method does NOT apply org-scoping (used for email lookups during auth)

- [ ] Create `IAuthSessionStore` interface in `Stretto.Application/Interfaces/IAuthSessionStore.cs` with three methods: `string CreateSession(Guid memberId)`, `Guid? GetMemberId(string token)`, `void DeleteSession(string token)`

- [ ] Create `InMemoryAuthSessionStore` in `Stretto.Infrastructure/Auth/InMemoryAuthSessionStore.cs` implementing `IAuthSessionStore`; use `ConcurrentDictionary<string, Guid>` as backing store; `CreateSession` generates a token via `Guid.NewGuid().ToString("N")`, stores `{token → memberId}`, returns the token; `GetMemberId` returns the value or `null` if absent; `DeleteSession` removes the key

- [ ] Create auth DTOs as records in `Stretto.Application/DTOs/AuthDtos.cs`: `LoginRequest(string Email)` and `AuthUserDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid OrgId, string OrgName)`

- [ ] Create `AuthService` in `Stretto.Application/Services/AuthService.cs`; constructor takes `IRepository<Member> members`, `IRepository<Organization> orgs`, `IAuthSessionStore sessions`; `LoginAsync(LoginRequest req)` calls `members.FindOneAsync(m => m.Email == req.Email && m.IsActive)`, throws `UnauthorizedException("Invalid email or account is inactive")` if null, calls `orgs.FindOneAsync(o => o.Id == member.OrganizationId)` to get org name, calls `sessions.CreateSession(member.Id)`, returns `(AuthUserDto dto, string token)`; `ValidateAsync(string token)` calls `sessions.GetMemberId(token)`, throws `UnauthorizedException` if null, fetches member and org, returns `AuthUserDto`; `LogoutAsync(string token)` calls `sessions.DeleteSession(token)` (no-op if token is not found)

- [ ] Create `AuthController` in `Stretto.Api/Controllers/AuthController.cs`; add `[ApiController]` and `[Route("auth")]` attributes; constructor takes `AuthService`; `POST /auth/login` accepts `[FromBody] LoginRequest`, calls `LoginAsync`, appends cookie `stretto_session` with options `HttpOnly=true, Secure=true, SameSite=SameSiteMode.Strict, Path="/"`, returns `Ok(dto)`; `GET /auth/validate` reads `Request.Cookies["stretto_session"]`, throws `UnauthorizedException` if missing, calls `ValidateAsync`, returns `Ok(dto)`; `POST /auth/logout` reads cookie, calls `LogoutAsync`, appends an expired replacement cookie to clear it (`Expires = DateTimeOffset.UtcNow.AddDays(-1)`), returns `NoContent()`

- [ ] Update `Stretto.Api/Program.cs`: add `builder.Services.AddControllers()`; add `builder.Services.AddSingleton<IAuthSessionStore, InMemoryAuthSessionStore>()`; add `builder.Services.AddScoped<AuthService>()`; call `app.MapControllers()` after the health endpoint; add the required `using` statements for the new namespaces (`Stretto.Application.Services`, `Stretto.Application.Interfaces`, `Stretto.Infrastructure.Auth`)

- [ ] Install npm packages in `src/Stretto.Web`: `npm install zustand react-hook-form @hookform/resolvers zod`

- [ ] Create `src/Stretto.Web/src/stores/authStore.ts`; define type `AuthUser { id: string; email: string; firstName: string; lastName: string; role: 'Admin' | 'Member'; orgId: string; orgName: string }`; create store with `create<{ user: AuthUser | null; setUser: (u: AuthUser) => void; clearUser: () => void }>(...)`; export as `useAuthStore`

- [ ] Create `src/Stretto.Web/src/nav.ts`; import Lucide icons `LayoutDashboard, CalendarDays, FolderOpen, Grid3x3, Users, Mic2, MapPin, Bell, Calendar, User`; export `adminNavItems` array with eight entries (Dashboard `/dashboard`, Program Years `/program-years`, Projects `/projects`, Utilization Grid `/utilization`, Members `/members`, Auditions `/auditions`, Venues `/venues`, Notifications `/notifications`) each with `{ label, to, icon }` shape; export `memberNavItems` array with four entries (My Projects `/my-projects`, My Calendar `/my-calendar`, Auditions `/auditions`, Profile `/profile`)

- [ ] Create `src/Stretto.Web/src/pages/LoginPage.tsx`; define Zod schema `z.object({ email: z.string().email('Enter a valid email') })`; use `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`; on valid submit call `fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) })`; on 200 parse JSON, call `useAuthStore.setUser(data)`, navigate to `/dashboard`; on error show `'Invalid email or account not found'` below the form; render `<input data-testid="email-input" />` and `<button data-testid="login-button" type="submit">`

- [ ] Create `src/Stretto.Web/src/components/ProtectedRoute.tsx`; import `useAuthStore` and `Navigate`, `Outlet` from react-router-dom; props interface `{ requiredRole?: 'Admin' | 'Member' }`; if `user` is null return `<Navigate to="/login" replace />`; if `requiredRole` is set and `user.role !== requiredRole` return `<Navigate to="/dashboard" replace />`; otherwise return `<Outlet />`

- [ ] Create `src/Stretto.Web/src/components/AppShell.tsx`; uses `useAuthStore` to get current user and determine nav items (admin → `adminNavItems`, member → `memberNavItems`); renders:  (1) on desktop (lg+) a fixed left sidebar 240px wide with org name at top, nav links each showing icon + label using `NavLink` with active styling, and user name + role display at the bottom; (2) on tablet (md to lg) the same sidebar in collapsed icon-only mode (64px) with a toggle button that expands it to 240px — sidebar state stored in `useState(false)`; (3) on mobile (below md) a fixed bottom tab bar showing up to 5 nav items with icon + label; main content area adjusts left margin for sidebar (`lg:ml-60`, `md:ml-16`) and bottom padding for tab bar (`pb-16 md:pb-0`); each nav link has `data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}`

- [ ] Create `src/Stretto.Web/src/pages/DashboardPage.tsx`; returns `<AppShell><div className="p-6"><h1 data-testid="dashboard-heading" className="text-2xl font-semibold">Dashboard</h1><p className="mt-2 text-muted-foreground">Welcome to Stretto.</p></div></AppShell>`

- [ ] Update `src/Stretto.Web/src/App.tsx`: import `LoginPage`, `DashboardPage`, `ProtectedRoute`; replace the placeholder `HomePage` with a redirect from `/` to `/login`; add `<Route path="/login" element={<LoginPage />} />` as a public route; wrap `<Route path="/dashboard" element={<DashboardPage />} />` inside `<Route element={<ProtectedRoute />} />`; add further protected placeholder routes for admin (`/program-years`, `/projects`, `/utilization`, `/members`, `/auditions`, `/venues`, `/notifications`) and member (`/my-projects`, `/my-calendar`, `/profile`) each rendering a minimal `<AppShell><p>Coming soon</p></AppShell>` inline element so nav links don't 404
