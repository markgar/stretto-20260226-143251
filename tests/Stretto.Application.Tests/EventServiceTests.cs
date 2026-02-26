using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for EventService — verifies list, get, create, update, and delete
/// business logic using real repositories backed by an in-memory database.
/// </summary>
public class EventServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC");
    private readonly AppDbContext _db;
    private readonly EventService _service;

    public EventServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("EventServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        var events = new BaseRepository<Event>(_db);
        var projects = new BaseRepository<Project>(_db);
        var venues = new BaseRepository<Venue>(_db);
        _service = new EventService(events, projects, venues);
    }

    public void Dispose() => _db.Dispose();

    private async Task<Project> SeedProjectAsync(
        DateOnly? start = null,
        DateOnly? end = null)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Spring Concert",
            ProgramYearId = Guid.NewGuid(),
            StartDate = start ?? new DateOnly(2025, 10, 1),
            EndDate = end ?? new DateOnly(2025, 11, 30),
            OrganizationId = OrgId
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project;
    }

    private async Task<Venue> SeedVenueAsync(string name = "City Hall")
    {
        var venue = new Venue
        {
            Id = Guid.NewGuid(),
            Name = name,
            Address = "123 Main St",
            OrganizationId = OrgId
        };
        _db.Venues.Add(venue);
        await _db.SaveChangesAsync();
        return venue;
    }

    // ListByProjectAsync

    [Fact]
    public async Task ListByProjectAsync_returns_events_for_project()
    {
        var project = await SeedProjectAsync();
        var req = new CreateEventRequest(project.Id, EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null);
        await _service.CreateAsync(OrgId, req);

        var result = await _service.ListByProjectAsync(project.Id, OrgId);

        Assert.Single(result);
        Assert.Equal(project.Id, result[0].ProjectId);
    }

    [Fact]
    public async Task ListByProjectAsync_returns_empty_when_no_events_for_project()
    {
        var project = await SeedProjectAsync();

        var result = await _service.ListByProjectAsync(project.Id, OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task ListByProjectAsync_resolves_venue_name_when_venue_assigned()
    {
        var project = await SeedProjectAsync();
        var venue = await SeedVenueAsync("Grand Hall");
        var req = new CreateEventRequest(project.Id, EventType.Performance,
            new DateOnly(2025, 10, 20), new TimeOnly(19, 0), 90, venue.Id);
        await _service.CreateAsync(OrgId, req);

        var result = await _service.ListByProjectAsync(project.Id, OrgId);

        Assert.Single(result);
        Assert.Equal("Grand Hall", result[0].VenueName);
        Assert.Equal(venue.Id, result[0].VenueId);
    }

    // GetAsync

    [Fact]
    public async Task GetAsync_returns_event_dto_with_all_fields()
    {
        var project = await SeedProjectAsync();
        var date = new DateOnly(2025, 10, 15);
        var startTime = new TimeOnly(18, 30);
        var req = new CreateEventRequest(project.Id, EventType.Rehearsal, date, startTime, 120, null);
        var created = await _service.CreateAsync(OrgId, req);

        var result = await _service.GetAsync(created.Id, OrgId);

        Assert.Equal(created.Id, result.Id);
        Assert.Equal(project.Id, result.ProjectId);
        Assert.Equal(EventType.Rehearsal, result.Type);
        Assert.Equal(date, result.Date);
        Assert.Equal(startTime, result.StartTime);
        Assert.Equal(120, result.DurationMinutes);
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_event_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(Guid.NewGuid(), OrgId));
    }

    // CreateAsync

    [Fact]
    public async Task CreateAsync_returns_dto_with_new_id()
    {
        var project = await SeedProjectAsync();
        var req = new CreateEventRequest(project.Id, EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null);

        var result = await _service.CreateAsync(OrgId, req);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(project.Id, result.ProjectId);
        Assert.Equal(EventType.Rehearsal, result.Type);
        Assert.Equal(120, result.DurationMinutes);
    }

    [Fact]
    public async Task CreateAsync_throws_NotFoundException_when_project_not_found()
    {
        var req = new CreateEventRequest(Guid.NewGuid(), EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.CreateAsync(OrgId, req));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_date_before_project_start()
    {
        var project = await SeedProjectAsync(new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 30));
        var req = new CreateEventRequest(project.Id, EventType.Rehearsal,
            new DateOnly(2025, 9, 30), new TimeOnly(18, 30), 120, null);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("date"));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_date_after_project_end()
    {
        var project = await SeedProjectAsync(new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 30));
        var req = new CreateEventRequest(project.Id, EventType.Rehearsal,
            new DateOnly(2025, 12, 1), new TimeOnly(18, 30), 120, null);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("date"));
    }

    // UpdateAsync

    [Fact]
    public async Task UpdateAsync_updates_event_fields_and_returns_dto()
    {
        var project = await SeedProjectAsync();
        var created = await _service.CreateAsync(OrgId, new CreateEventRequest(
            project.Id, EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null));

        var updateReq = new UpdateEventRequest(EventType.Performance,
            new DateOnly(2025, 10, 20), new TimeOnly(19, 0), 90, null);
        var result = await _service.UpdateAsync(created.Id, OrgId, updateReq);

        Assert.Equal(EventType.Performance, result.Type);
        Assert.Equal(new DateOnly(2025, 10, 20), result.Date);
        Assert.Equal(90, result.DurationMinutes);
    }

    [Fact]
    public async Task UpdateAsync_throws_NotFoundException_when_event_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateAsync(Guid.NewGuid(), OrgId,
                new UpdateEventRequest(EventType.Rehearsal,
                    new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null)));
    }

    [Fact]
    public async Task UpdateAsync_throws_ValidationException_when_date_outside_project_range()
    {
        var project = await SeedProjectAsync(new DateOnly(2025, 10, 1), new DateOnly(2025, 11, 30));
        var created = await _service.CreateAsync(OrgId, new CreateEventRequest(
            project.Id, EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null));

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(created.Id, OrgId,
                new UpdateEventRequest(EventType.Rehearsal,
                    new DateOnly(2026, 1, 1), new TimeOnly(18, 30), 120, null)));

        Assert.True(ex.Errors.ContainsKey("date"));
    }

    // DeleteAsync

    [Fact]
    public async Task DeleteAsync_removes_event_so_subsequent_get_throws()
    {
        var project = await SeedProjectAsync();
        var created = await _service.CreateAsync(OrgId, new CreateEventRequest(
            project.Id, EventType.Rehearsal,
            new DateOnly(2025, 10, 15), new TimeOnly(18, 30), 120, null));

        await _service.DeleteAsync(created.Id, OrgId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(created.Id, OrgId));
    }

    [Fact]
    public async Task DeleteAsync_throws_NotFoundException_when_event_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteAsync(Guid.NewGuid(), OrgId));
    }
}
