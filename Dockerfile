FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY Stretto.sln ./
COPY src/Stretto.Domain/Stretto.Domain.csproj src/Stretto.Domain/
COPY src/Stretto.Application/Stretto.Application.csproj src/Stretto.Application/
COPY src/Stretto.Infrastructure/Stretto.Infrastructure.csproj src/Stretto.Infrastructure/
COPY src/Stretto.Api/Stretto.Api.csproj src/Stretto.Api/
COPY tests/Stretto.Api.Tests/Stretto.Api.Tests.csproj tests/Stretto.Api.Tests/
COPY tests/Stretto.Domain.Tests/Stretto.Domain.Tests.csproj tests/Stretto.Domain.Tests/
COPY tests/Stretto.Application.Tests/Stretto.Application.Tests.csproj tests/Stretto.Application.Tests/
COPY tests/Stretto.Infrastructure.Tests/Stretto.Infrastructure.Tests.csproj tests/Stretto.Infrastructure.Tests/

RUN dotnet restore

COPY . .

RUN dotnet publish src/Stretto.Api/Stretto.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080
ENTRYPOINT ["dotnet", "Stretto.Api.dll"]
