# Stretto — Technical Spec

## Summary

Stretto is a SaaS platform for arts organizations to manage members, projects (concerts), program years, auditions, venues, events, and attendance. All data is tenant-isolated per organization in a shared deployment.

## Tech Stack

- **Backend**: .NET 10, C# with nullable reference types enabled, ASP.NET Core Web API
- **ORM**: Entity Framework Core with in-memory database (swappable to SQL Server/PostgreSQL)
- **Frontend**: React 18 + TypeScript (strict mode), Vite, React Router
- **UI**: shadcn/ui + Tailwind CSS; React Hook Form + Zod; Tanstack Query; Tanstack Table; Zustand; date-fns; Lucide React
- **API Contract**: OpenAPI/Swagger spec; auto-generated TypeScript client (openapi-typescript-codegen)
- **File Storage**: Local filesystem behind a storage provider abstraction interface
- **Notifications**: Provider abstraction interface; stubbed (no emails sent in Phase 1)

## Architecture

Four-layer clean architecture — dependency rule flows inward only:

- **Stretto.Domain** — Entities, value objects, business rules. No external dependencies.
- **Stretto.Application** — Use cases, interfaces (IRepository, IStorageProvider, INotificationProvider), DTOs. Depends on Domain only.
- **Stretto.Infrastructure** — EF Core DbContext, repository implementations, file storage, notification stub. Implements Application interfaces.
- **Stretto.Api** — ASP.NET Core controllers (thin, delegate to Application), OpenAPI/Swagger, DI wiring.
- **Stretto.Web** — React frontend (`src/Stretto.Web`). Communicates with the API via auto-generated TypeScript client.

Entity mappings use Fluent API exclusively — no data annotations, no convention-based configuration.

## Cross-Cutting Concerns

**Multi-tenancy**: Every entity carries `OrganizationId`. All queries are scoped to the current user's organization via a base repository or query filter. No cross-tenant data leakage.

**Authentication**: Passwordless email flow (Phase 1: email-only, no code sent). A persistent HttpOnly/Secure/SameSite=Strict cookie references a server-side session token. The API exposes `/auth/login`, `/auth/validate`, and `/auth/logout`. Roles: Admin and Member.

**Error handling**: Application layer throws typed exceptions (e.g., `NotFoundException`, `ValidationException`). The API layer maps these to appropriate HTTP status codes via a global exception handler. Validation errors return 400 with field-level detail.

**Formatting**: `dotnet format` for backend; ESLint + Prettier for frontend. Configs checked in.

## Acceptance Criteria

- Members can register via audition sign-up and be managed by admins
- Program years can be created, made current, and archived
- Projects can be created within program years; members can be assigned/unassigned
- The utilization grid shows member × project assignments, sorted by utilization
- Audition dates generate time slots; members can sign up; admins can record notes and set statuses
- Venues can be created and associated with events
- Events (rehearsals/performances) can be scheduled; members can check in via unique event URL
- Project materials (links and documents) can be shared with assigned members
- Members can view a personal calendar with iCal export
- Admins can send announcement emails via the notification abstraction
- The application builds, runs, and all tests pass with documented single-line commands
