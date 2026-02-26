# DEPLOY.md — Stretto Deployment Guide

## Overview

Stretto is an ASP.NET Core 10.0 Web API. This document covers how to build and run it in Docker.

## Dockerfile

- **Location**: `Dockerfile` at repository root
- **Multi-stage build**: SDK image (`mcr.microsoft.com/dotnet/sdk:10.0`) for build, runtime image (`mcr.microsoft.com/dotnet/aspnet:10.0`) for final image
- **Build command**: `dotnet publish src/Stretto.Api/Stretto.Api.csproj -c Release -o /app/publish`
- **Entry point**: `dotnet Stretto.Api.dll`

## Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` | Required to enable Swagger UI |
| `ASPNETCORE_URLS` | `http://+:8080` | Container listens on port 8080 |

## Port Mappings

- Container port: `8080`
- Host port: `7777` (mapped as `7777:8080` in docker-compose.yml)

## Docker Compose

```bash
export COMPOSE_PROJECT_NAME=stretto-20260226-143251
docker compose up -d
```

The `docker-compose.yml` defines:
- `app` service: the API, mapped to host port 7777
- `playwright` service: for UI testing (in `testing` profile only)
- `stretto-net` bridge network

## Startup Sequence

1. No database startup required (uses EF Core InMemory)
2. No migrations needed
3. App starts immediately and is ready on first request

## Health Check

- **Endpoint**: `GET /health`
- **Expected response**: `HTTP 200` with body `{"status":"healthy"}`
- **Check**: `curl http://localhost:7777/health`

## Swagger / OpenAPI

- Available at `GET /swagger/v1/swagger.json` when `ASPNETCORE_ENVIRONMENT=Development`
- Swagger UI at `GET /swagger` (redirects to `/swagger/index.html`)

## Known Gotchas

- **HTTPS redirect**: `app.UseHttpsRedirection()` is in Program.cs. In Docker with HTTP-only, this could cause redirect loops if the client follows redirects to HTTPS. Use `http://localhost:7777` directly — HTTP works fine.
- **Development environment required for Swagger**: Set `ASPNETCORE_ENVIRONMENT=Development` or Swagger endpoints won't be registered.
- **.dockerignore**: Excludes `bin/`, `obj/`, `.git/`, etc. to keep build context small and prevent stale artifacts.

## Building and Testing Locally (without Docker)

```bash
dotnet build Stretto.sln          # should exit 0
dotnet test Stretto.sln           # should exit 0 with 1 passing test
```

Requires .NET 10 SDK installed.
