# Review Themes

Last updated: Scaffolding — .NET 10 solution and backend projects

1. **TreatWarningsAsErrors missing** — Always add `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` to every `<PropertyGroup>` in every .csproj file alongside `<Nullable>enable</Nullable>`; nullable warnings that don't fail the build silently accumulate into dead null-safety.
2. **Backslash path separators in .sln and .csproj** — Use forward slashes in all solution and project reference paths; backslashes are a Windows convention that breaks non-normalising tooling on Linux CI agents.
3. **Program not exposed for integration tests** — In top-level minimal-API projects, always append `public partial class Program { }` to `Program.cs` so `WebApplicationFactory<Program>` compiles in the test project.
4. **Speculative README references** — Only reference files and commands that exist in the current codebase; remove forward references to unimplemented infrastructure (e.g. `SeedData.cs`) until those files are scaffolded.
