using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Api.Tests;

/// <summary>
/// Unit tests for ProjectService — verifies CRUD business logic using real InMemory repositories.
/// </summary>
public class ProjectServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
    private readonly AppDbContext _db;
    private readonly ProjectService _service;

    public ProjectServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("ProjectServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        var projects = new BaseRepository<Project>(_db);
        var programYears = new BaseRepository<ProgramYear>(_db);
        _service = new ProjectService(projects, programYears);
    }

    public void Dispose() => _db.Dispose();

    private async Task<ProgramYear> SeedProgramYearAsync(
        DateOnly? start = null,
        DateOnly? end = null)
    {
        var py = new ProgramYear
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrgId,
            Name = "2025-2026",
            StartDate = start ?? new DateOnly(2025, 9, 1),
            EndDate = end ?? new DateOnly(2026, 6, 30),
            IsCurrent = true,
            IsArchived = false
        };
        _db.ProgramYears.Add(py);
        await _db.SaveChangesAsync();
        return py;
    }

    [Fact]
    public async Task ListByProgramYearAsync_returns_only_projects_for_given_program_year()
    {
        var py1 = await SeedProgramYearAsync();
        var py2 = await SeedProgramYearAsync(new DateOnly(2024, 9, 1), new DateOnly(2025, 6, 30));

        await _service.CreateAsync(OrgId, new CreateProjectRequest(py1.Id, "Spring Concert",
            new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1)));
        await _service.CreateAsync(OrgId, new CreateProjectRequest(py2.Id, "Fall Concert",
            new DateOnly(2024, 10, 1), new DateOnly(2024, 11, 1)));

        var result = await _service.ListByProgramYearAsync(py1.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("Spring Concert", result[0].Name);
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_project_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task CreateAsync_throws_NotFoundException_when_program_year_not_found()
    {
        var req = new CreateProjectRequest(Guid.NewGuid(), "Concert",
            new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.CreateAsync(OrgId, req));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_startDate_equals_endDate()
    {
        var py = await SeedProgramYearAsync();
        var date = new DateOnly(2025, 10, 1);
        var req = new CreateProjectRequest(py.Id, "Concert", date, date);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_startDate_after_endDate()
    {
        var py = await SeedProgramYearAsync();
        var req = new CreateProjectRequest(py.Id, "Concert",
            new DateOnly(2025, 11, 1), new DateOnly(2025, 10, 1));

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_dates_outside_program_year()
    {
        var py = await SeedProgramYearAsync();
        var req = new CreateProjectRequest(py.Id, "Concert",
            new DateOnly(2024, 1, 1), new DateOnly(2024, 2, 1));

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));
    }

    [Fact]
    public async Task CreateAsync_returns_dto_and_project_is_retrievable()
    {
        var py = await SeedProgramYearAsync();
        var req = new CreateProjectRequest(py.Id, "Spring Concert",
            new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1));

        var created = await _service.CreateAsync(OrgId, req);

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Spring Concert", created.Name);
        Assert.Equal(py.Id, created.ProgramYearId);

        var fetched = await _service.GetAsync(created.Id, OrgId);
        Assert.Equal(created.Id, fetched.Id);
    }

    [Fact]
    public async Task UpdateAsync_updates_name_and_dates()
    {
        var py = await SeedProgramYearAsync();
        var created = await _service.CreateAsync(OrgId, new CreateProjectRequest(py.Id, "Old Name",
            new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1)));

        var updated = await _service.UpdateAsync(created.Id, OrgId,
            new UpdateProjectRequest("New Name", new DateOnly(2025, 10, 5), new DateOnly(2025, 11, 5)));

        Assert.Equal("New Name", updated.Name);
        Assert.Equal(new DateOnly(2025, 10, 5), updated.StartDate);
    }

    [Fact]
    public async Task UpdateAsync_throws_NotFoundException_when_project_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateAsync(Guid.NewGuid(), OrgId,
                new UpdateProjectRequest("Name", new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1))));
    }

    [Fact]
    public async Task DeleteAsync_removes_project_so_subsequent_get_throws()
    {
        var py = await SeedProgramYearAsync();
        var created = await _service.CreateAsync(OrgId, new CreateProjectRequest(py.Id, "Concert",
            new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 1)));

        await _service.DeleteAsync(created.Id, OrgId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(created.Id, OrgId));
    }

    [Fact]
    public async Task DeleteAsync_throws_NotFoundException_when_project_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteAsync(Guid.NewGuid(), OrgId));
    }
}
