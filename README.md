# Stretto

Multi-tenant management platform for arts organizations — members, projects, program years, auditions, and events in one place.

## Build & Run

```bash
# Backend
dotnet restore && dotnet build
dotnet run --project src/Stretto.Api

# Frontend
cd src/Stretto.Web && npm install && npm run dev

# Run all tests
dotnet test
cd src/Stretto.Web && npm test
npx playwright test
```

## Development

- Backend: .NET 10, clean architecture (`Stretto.Domain`, `Stretto.Application`, `Stretto.Infrastructure`, `Stretto.Api`)
- Frontend: React + TypeScript + Vite in `src/Stretto.Web`
- API contract: OpenAPI spec served at `/swagger`; TypeScript client auto-generated via `npm run generate`
- See REQUIREMENTS.md for full feature details and SPEC.md for technical decisions.
