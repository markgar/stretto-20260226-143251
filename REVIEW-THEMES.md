# Review Themes

Last updated: Domain Entities + Application Interfaces

1. **TreatWarningsAsErrors missing** — Always add `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` to every `<PropertyGroup>` in every .csproj file alongside `<Nullable>enable</Nullable>`; nullable warnings that don't fail the build silently accumulate into dead null-safety.
2. **Backslash path separators in .sln and .csproj** — Use forward slashes in all solution and project reference paths; backslashes are a Windows convention that breaks non-normalising tooling on Linux CI agents.
3. **Program not exposed for integration tests** — In top-level minimal-API projects, always append `public partial class Program { }` to `Program.cs` so `WebApplicationFactory<Program>` compiles in the test project.
4. **Speculative README references** — Only reference files and commands that exist in the current codebase; remove forward references to unimplemented infrastructure (e.g. `SeedData.cs`) until those files are scaffolded.
5. **Vite scaffold boilerplate not cleaned up** — After `npm create vite`, always delete unused template files (`App.css`, `assets/react.svg`, default `README.md`) and update `index.html` `<title>` to the real app name before committing.
6. **Duplicate ESLint config formats** — ESLint 9 uses flat config (`eslint.config.js`) exclusively and silently ignores `.eslintrc.cjs`; never commit both files; configure all plugins once in `eslint.config.js` using the flat config API.
7. **Development environment baked into Docker image** — Never set `ENV ASPNETCORE_ENVIRONMENT=Development` (or equivalent) in the Dockerfile itself; keep it only in docker-compose for local dev so production deployments default to a safe environment.
8. **Entity named for a concept it doesn't store** — When an entity is named after a temporal concept (e.g., `AuditionDate`, `EventDay`), verify it carries a `Date: DateOnly` or `DateTimeOffset` property; a time-only entity without a date is unschedulable and breaks downstream calendar/slot generation logic.
