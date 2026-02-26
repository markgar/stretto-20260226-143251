# Copilot Instructions

## About this codebase

This software is written with assistance from GitHub Copilot. The code is structured to be readable, modifiable, and extendable by Copilot (and other LLM-based agents). Every design decision should reinforce that.

### Guidelines for LLM-friendly code

- **Flat, explicit control flow.** Prefer straightforward if/else and early returns over deeply nested logic, complex inheritance hierarchies, or metaprogramming. Every function should be understandable from its source alone.
- **Small, single-purpose functions.** Keep functions short (ideally under ~40 lines). Each function does one thing with a clear name that describes it. This gives the LLM better context boundaries.
- **Descriptive naming over comments.** Variable and function names should make intent obvious. Use comments only when *why* isn't clear from the code — never to explain *what*.
- **Colocate related logic.** Keep constants, helpers, and the code that uses them close together (or in the same small file). Avoid scattering related pieces across many modules — LLMs work best when relevant context is nearby.
- **Consistent patterns.** When multiple functions do similar things, structure them identically. Consistent shape lets the LLM reliably extend the pattern.
- **No magic.** Avoid decorators that hide behavior, dynamic attribute access, implicit registration, or monkey-patching. Everything should be traceable by reading the code top-to-bottom.
- **Graceful error handling.** Wrap I/O and external calls in try/except (or the language's equivalent). Never let a transient failure crash the main workflow. Log the error and continue.
- **Minimal dependencies.** Only add a dependency when it provides substantial value. Fewer deps mean less surface area for the LLM to misunderstand.
- **One concept per file.** Each module owns a single concern. Don't mix unrelated responsibilities in the same file.
- **Design for testability.** Separate pure decision logic from I/O and subprocess calls so core functions can be tested without mocking. Pass dependencies as arguments rather than hard-coding them inside functions when practical. Keep side-effect-free helpers (parsing, validation, data transforms) in their own functions so they can be unit tested directly.

### Documentation maintenance

- When completing a task that changes the project structure, key files, architecture, or conventions, update `.github/copilot-instructions.md` to reflect the change.
- Keep the project-specific sections (Project structure, Key files, Architecture, Conventions) accurate and current.
- Never modify the coding guidelines or testing conventions sections above.
- This file is a **style guide**, not a spec. Describe file **roles** (e.g. 'server entry point'), not implementation details (e.g. 'uses List<T> with auto-incrementing IDs'). Conventions describe coding **patterns** (e.g. 'consistent JSON error envelope'), not implementation choices (e.g. 'store data in a static variable'). SPEC.md covers what to build — this file covers how to write code that fits the project.

## Project structure

The solution is organized into five projects following clean architecture:

- `src/Stretto.Domain/` — Core entities and business rules; no external dependencies.
- `src/Stretto.Application/` — Use cases, interfaces, and DTOs; depends only on Domain.
- `src/Stretto.Infrastructure/` — EF Core DbContext, repository implementations, file storage, and notification stubs; implements Application interfaces.
- `src/Stretto.Api/` — ASP.NET Core Web API; thin controllers, DI wiring, OpenAPI/Swagger; depends on Application.
- `src/Stretto.Web/` — React + TypeScript frontend built with Vite; communicates with the API via auto-generated TypeScript client.

Test projects mirror the source layout (e.g., `tests/Stretto.Domain.Tests/`, `tests/Stretto.Application.Tests/`, `tests/Stretto.Api.Tests/`). Frontend tests live alongside source files in `src/Stretto.Web/`.

## Key files

- `SPEC.md` — Authoritative technical specification and architecture overview.
- `REQUIREMENTS.md` — Original project requirements and feature descriptions.
- `README.md` — Setup, build, and run instructions.
- `.gitignore` — Git ignore rules for the repository.
- `src/Stretto.Web/src/App.tsx` — Root React component with route definitions.
- `src/Stretto.Web/src/main.tsx` — React entry point; wraps app in `BrowserRouter`.
- `src/Stretto.Web/components.json` — shadcn/ui configuration (New York style, Neutral color).
- `src/Stretto.Web/src/lib/utils.ts` — shadcn/ui `cn` utility for Tailwind class merging.
- `src/Stretto.Web/src/api/generated/` — Auto-generated TypeScript API client (run `npm run generate`).

## Architecture

The backend follows a four-layer clean architecture where dependency arrows point inward: Api → Application → Domain, and Infrastructure → Application → Domain. Controllers in `Stretto.Api` are thin — they validate HTTP input, delegate to Application-layer use cases (services), and map results to HTTP responses. The Application layer owns business logic and defines interfaces (`IRepository<T>`, `IStorageProvider`, `INotificationProvider`) that Infrastructure implements, keeping Domain and Application free of framework dependencies. The React frontend in `Stretto.Web` is entirely decoupled from the backend: it consumes the auto-generated TypeScript API client produced from the backend's OpenAPI spec, so the contract is always in sync. All data is tenant-scoped by `OrganizationId` enforced in the repository layer, not in individual controllers or use cases.

## Testing conventions

- **Use the project's test framework.** Plain functions with descriptive names.
- **Test the contract, not the implementation.** A test should describe expected behavior in terms a user would understand — not mirror the code's internal branching. If the test would break when you refactor internals without changing behavior, it's too tightly coupled.
- **Name tests as behavioral expectations.** `test_expired_token_triggers_refresh` not `test_check_token_returns_false`. The test name should read like a requirement.
- **Use realistic inputs.** Feed real-looking data, not minimal one-line synthetic strings. Edge cases should be things that could actually happen — corrupted inputs, empty files, missing fields.
- **Prefer regression tests.** When a bug is found, write the test that would have caught it before fixing it. This is the highest-value test you can write.
- **Don't test I/O wrappers.** Functions that just read a file and call a pure helper don't need their own tests — test the pure helper directly.
- **No mocking unless unavoidable.** Extract pure functions for testability so you don't need mocks. If you find yourself mocking, consider whether you should be testing a different function.

## Conventions

- **Thin controllers.** Controllers in `Stretto.Api` handle HTTP concerns only — parse input, call one Application service method, return the result. Business logic belongs in the Application layer.
- **Typed exceptions with global mapping.** Application services throw named exception types (e.g., `NotFoundException`, `ValidationException`). A single global exception handler in the API layer maps these to HTTP status codes; no try/catch in controllers.
- **Consistent JSON error envelope.** All error responses follow the same shape: an HTTP status code plus a body with a `message` field and, for validation errors, a `errors` map of field-level messages.
- **Fluent API only for EF Core.** All entity mappings use the Fluent API in explicit configuration classes — no data annotations on domain entities, no convention-based column inference.
- **Repository per aggregate.** Each aggregate root has its own repository interface in the Application layer and a corresponding implementation in Infrastructure. Repositories always scope queries to the current `OrganizationId`.
- **React Hook Form + Zod for every form.** Define a Zod schema first, derive the TypeScript type with `z.infer`, and wire it to `useForm`. No `useState`-based form state.
- **Tanstack Query for all API calls.** Every data fetch uses `useQuery`; every mutation uses `useMutation`. No raw `useEffect` + `fetch` patterns.
- **Zustand for cross-cutting state.** Auth context, current organization, and current program year live in Zustand stores — not React Context or component-local state.
- **`data-testid` on interactive elements.** All buttons, inputs, and navigation links carry a `data-testid` attribute to enable reliable selection in Playwright and React Testing Library tests.
- **date-fns for all date handling.** No `moment.js`, no raw `Date` arithmetic. Import only the specific date-fns functions needed.
- **Lucide React for all icons.** Do not introduce additional icon libraries.
