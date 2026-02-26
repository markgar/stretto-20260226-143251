## Milestone: Scaffolding — .NET 10 solution and backend projects

> **Validates:**
> - `dotnet build Stretto.sln` exits 0 from the repository root
> - `dotnet test Stretto.sln` exits 0 and reports at least 1 passing test
> - `GET /health` returns HTTP 200 with body `{"status":"healthy"}` when the API is running

> **Reference files:**
> This is the first milestone — no prior patterns exist. The builder establishes the patterns that all future milestones will follow.

- [x] Create `Stretto.sln` solution file and `src/Stretto.Domain` class library project targeting net10.0 with `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>`; add Domain to the solution
- [x] Add `src/Stretto.Application` class library project (net10.0, Nullable=enable, ImplicitUsings=enable); add a project reference from Application to Domain; add Application to the solution
- [x] Add `src/Stretto.Infrastructure` class library project (net10.0, Nullable=enable, ImplicitUsings=enable); add a project reference from Infrastructure to Application; add `Microsoft.EntityFrameworkCore.InMemory` NuGet package; add Infrastructure to the solution
- [x] Add `src/Stretto.Api` ASP.NET Core Web API project (net10.0, Nullable=enable, ImplicitUsings=enable); add project references to Application and Infrastructure; add Stretto.Api to the solution
- [x] Add `GET /health` minimal API endpoint to `Program.cs` in Stretto.Api that returns HTTP 200 with JSON body `{ "status": "healthy" }`; add Swagger/OpenAPI middleware so `GET /swagger/v1/swagger.json` is served in development
- [x] Add `.editorconfig` at the repository root with C# formatting rules for `dotnet format` (indent_style=space, indent_size=4, charset=utf-8, trim_trailing_whitespace=true, csharp_new_line_before_open_brace=all)
- [ ] Add `tests/Stretto.Api.Tests` xUnit test project (net10.0); add project reference to Stretto.Api; add a placeholder test class `HealthEndpointTests` with a single test `Placeholder_Passes` that asserts `true`; add the test project to the solution
