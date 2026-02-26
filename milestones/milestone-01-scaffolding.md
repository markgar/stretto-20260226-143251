## Milestone: Scaffolding — .NET 10 solution + React/Vite frontend

> **Validates:**
> - `dotnet build Stretto.sln` exits 0 from the repository root
> - `dotnet test Stretto.sln` exits 0 and reports at least 1 passing test
> - `GET /health` returns HTTP 200 with body `{"status":"healthy"}` when the API is running
> - `cd src/Stretto.Web && npm install && npm test` exits 0 and reports at least 1 passing test
> - `cd src/Stretto.Web && npm run build` exits 0 (frontend builds without errors)

> **Reference files:**
> This is the first milestone — no prior patterns exist. The builder establishes the patterns that all future milestones will follow.

- [ ] Create `Stretto.sln` solution file and `src/Stretto.Domain` class library project targeting net10.0 with `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>`; add Domain to the solution
- [ ] Add `src/Stretto.Application` class library project (net10.0, Nullable=enable, ImplicitUsings=enable); add a project reference from Application to Domain; add Application to the solution
- [ ] Add `src/Stretto.Infrastructure` class library project (net10.0, Nullable=enable, ImplicitUsings=enable); add a project reference from Infrastructure to Application; add `Microsoft.EntityFrameworkCore.InMemory` NuGet package; add Infrastructure to the solution
- [ ] Add `src/Stretto.Api` ASP.NET Core Web API project (net10.0, Nullable=enable, ImplicitUsings=enable); add project references to Application and Infrastructure; add Stretto.Api to the solution
- [ ] Add `GET /health` minimal API endpoint to `Program.cs` in Stretto.Api that returns HTTP 200 with JSON body `{ "status": "healthy" }`; add Swagger/OpenAPI middleware so `GET /swagger/v1/swagger.json` is served in development
- [ ] Add `.editorconfig` at the repository root with C# formatting rules for `dotnet format` (indent_style=space, indent_size=4, charset=utf-8, trim_trailing_whitespace=true, csharp_new_line_before_open_brace=all)
- [ ] Add `tests/Stretto.Api.Tests` xUnit test project (net10.0); add project reference to Stretto.Api; add a placeholder test class `HealthEndpointTests` with a single test `Placeholder_Passes` that asserts `true`; add the test project to the solution
- [ ] Scaffold `src/Stretto.Web` as a Vite + React + TypeScript project using `npm create vite@latest` with the `react-ts` template; set `strict: true` in `tsconfig.json`; replace the default `App.tsx` with a minimal placeholder rendering `<h1>Stretto</h1>` on a root route `/`; add `react-router-dom` and wire `<BrowserRouter>` in `main.tsx`
- [ ] Add Tailwind CSS to `src/Stretto.Web`: install `tailwindcss`, `postcss`, and `autoprefixer`; run `npx tailwindcss init -p`; configure `tailwind.config.js` content paths to `["./index.html","./src/**/*.{ts,tsx}"]`; add `@tailwind base/components/utilities` directives to `src/index.css`
- [ ] Add shadcn/ui to `src/Stretto.Web`: run `npx shadcn@latest init` with default style (New York), base color (Neutral), and CSS variables enabled; this creates `components.json` and `src/lib/utils.ts`
- [ ] Add ESLint and Prettier to `src/Stretto.Web`: install `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `prettier`, and `eslint-config-prettier`; add `.eslintrc.cjs` extending `plugin:@typescript-eslint/recommended` and `prettier`; add `.prettierrc` with `{ "semi": true, "singleQuote": true, "printWidth": 100 }`; add `"lint"` and `"format"` scripts to `package.json`
- [ ] Install Vitest and React Testing Library in `src/Stretto.Web`: add `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` as dev dependencies; configure `test` in `vite.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./src/setupTests.ts']`; create `src/setupTests.ts` importing `@testing-library/jest-dom`; add `"test": "vitest run"` script to `package.json`; add a placeholder test `src/App.test.tsx` that renders `<App />` inside a `MemoryRouter` and asserts the heading `Stretto` is visible
- [ ] Install `openapi-typescript-codegen` in `src/Stretto.Web` as a dev dependency; add a `"generate"` script to `package.json`: `"openapi --input http://localhost:5000/swagger/v1/swagger.json --output src/api/generated --client axios"`; create the empty directory `src/api/generated/.gitkeep` so the output path is committed
