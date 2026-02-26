## Milestone: Members — Backend CRUD

> **Validates:**
> - `POST /auth/login` then `GET /members` with the session cookie returns HTTP 200 with a JSON array
> - `POST /members` with `{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","role":"Member"}` returns HTTP 201 with an `id` field
> - `GET /members/{id}` for the created member returns HTTP 200 with `assignments` array
> - `GET /members?search=jane` returns only members whose name or email contains "jane" (case-insensitive)
> - `DELETE /members/{id}` sets the member's `isActive` to `false`; subsequent `GET /members/{id}` returns `"isActive": false`

> **Reference files:**
> - `src/Stretto.Domain/Entities/Member.cs` — entity to map (fields: Id, FirstName, LastName, Email, Role, IsActive, OrganizationId)
> - `src/Stretto.Application/DTOs/MemberDtos.cs` — DTOs created in milestone-05a
> - `src/Stretto.Application/Interfaces/IRepository.cs` — available repository methods (GetByIdAsync, ListAsync, FindOneAsync, AddAsync, UpdateAsync)
> - `src/Stretto.Application/Interfaces/ICurrentUserService.cs` — interface created in milestone-05a
> - `src/Stretto.Application/Services/AuthService.cs` — pattern for service constructor injection, NotFoundException/ValidationException usage
> - `src/Stretto.Api/Controllers/AuthController.cs` — thin controller pattern, IActionResult returns
> - `src/Stretto.Api/Program.cs` — DI registration pattern (AddScoped)

- [ ] Create `src/Stretto.Application/Services/MemberService.cs`; constructor takes `IRepository<Member> members`, `IRepository<ProjectAssignment> assignments`, `IRepository<Project> projects`; implement `ListAsync(Guid orgId, string? search)` → calls `_members.ListAsync(orgId)`, filters case-insensitively on `FirstName`, `LastName`, `Email` if search is non-empty, returns `List<MemberDto>`; implement `GetByIdAsync(Guid id, Guid orgId)` → calls `_members.GetByIdAsync(id, orgId)`, throws `NotFoundException("Member not found")` if null, loads assignments via `_assignments.ListAsync(orgId, a => a.MemberId == id)`, resolves project names via `_projects.GetByIdAsync(projectId, orgId)` for each assignment, returns `MemberDetailDto`

- [ ] Add `CreateAsync(Guid orgId, CreateMemberRequest req)` to `MemberService`: validate `req.Role` parses to `Role` enum (throw `ValidationException` with `{ "role": "Invalid role value" }` if not); check uniqueness — `_members.FindOneAsync(m => m.Email == req.Email && m.OrganizationId == orgId)` throws `ValidationException` with `{ "email": "Email is already in use" }` if found; create `new Member { Id = Guid.NewGuid(), FirstName = req.FirstName, LastName = req.LastName, Email = req.Email, Role = parsedRole, IsActive = true, OrganizationId = orgId }`; call `_members.AddAsync(member)`; return `MemberDto`

- [ ] Add `UpdateAsync(Guid id, Guid orgId, UpdateMemberRequest req)` and `DeactivateAsync(Guid id, Guid orgId)` to `MemberService`: `UpdateAsync` loads member via `GetByIdAsync`, validates role enum, updates `FirstName`, `LastName`, `Email`, `Role`, calls `UpdateAsync`; `DeactivateAsync` loads member via `GetByIdAsync`, sets `IsActive = false`, calls `UpdateAsync`; both return `MemberDto`

- [ ] Register `MemberService` as scoped in `src/Stretto.Api/Program.cs`: `builder.Services.AddScoped<MemberService>()`

- [ ] Create `src/Stretto.Api/Controllers/MembersController.cs` with `[ApiController, Route("members")]`; constructor takes `MemberService memberService` and `ICurrentUserService currentUser`; add private helper `async Task<Guid> GetOrgIdAsync()` that calls `currentUser.GetCurrentUserAsync()` and throws `UnauthorizedException()` if null, returns `dto.OrgId`; implement: `[HttpGet] GET /members?search=` calling `memberService.ListAsync(orgId, search)` → `Ok(result)`; `[HttpGet("{id}")] GET /members/{id}` → `Ok(result)`; `[HttpPost] POST /members` → `Created($"/members/{result.Id}", result)`; `[HttpPut("{id}")] PUT /members/{id}` → `Ok(result)`; `[HttpDelete("{id}")] DELETE /members/{id}` → `NoContent()`
