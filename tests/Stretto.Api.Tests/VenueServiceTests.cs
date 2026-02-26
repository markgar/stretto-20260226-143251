using System.Linq.Expressions;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;
using Stretto.Domain.Entities;

namespace Stretto.Api.Tests;

/// <summary>
/// Unit tests for VenueService — verifies CRUD business logic.
/// </summary>
public class VenueServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private class FakeVenueRepository : IRepository<Venue>
    {
        private readonly List<Venue> _store = new();

        public void Seed(Venue v) => _store.Add(v);

        public Task<Venue?> GetByIdAsync(Guid id, Guid orgId) =>
            Task.FromResult(_store.FirstOrDefault(v => v.Id == id && v.OrganizationId == orgId));

        public Task<Venue?> FindOneAsync(Expression<Func<Venue, bool>> predicate) =>
            Task.FromResult(_store.FirstOrDefault(predicate.Compile()));

        public Task<List<Venue>> ListAsync(Guid orgId, Expression<Func<Venue, bool>>? predicate = null) =>
            Task.FromResult(_store.Where(v => v.OrganizationId == orgId).ToList());

        public Task AddAsync(Venue entity) { _store.Add(entity); return Task.CompletedTask; }
        public Task UpdateAsync(Venue entity) => Task.CompletedTask;
        public Task DeleteAsync(Venue entity) { _store.Remove(entity); return Task.CompletedTask; }
    }

    private static Venue MakeVenue(string name = "City Hall", string address = "1 Main St") => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Address = address,
        ContactName = "Bob",
        ContactEmail = "bob@example.com",
        ContactPhone = "555-1234",
        OrganizationId = OrgId
    };

    [Fact]
    public async Task ListAsync_returns_all_venues_for_org()
    {
        var repo = new FakeVenueRepository();
        repo.Seed(MakeVenue("City Hall"));
        repo.Seed(MakeVenue("Grand Ballroom", "2 Oak Ave"));
        var service = new VenueService(repo);

        var result = await service.ListAsync(OrgId);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, v => v.Name == "City Hall");
        Assert.Contains(result, v => v.Name == "Grand Ballroom");
    }

    [Fact]
    public async Task ListAsync_returns_empty_list_when_no_venues_exist()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);

        var result = await service.ListAsync(OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAsync_returns_venue_dto_for_existing_venue()
    {
        var repo = new FakeVenueRepository();
        var venue = MakeVenue("City Hall");
        repo.Seed(venue);
        var service = new VenueService(repo);

        var result = await service.GetAsync(venue.Id, OrgId);

        Assert.Equal(venue.Id, result.Id);
        Assert.Equal("City Hall", result.Name);
        Assert.Equal("1 Main St", result.Address);
        Assert.Equal("Bob", result.ContactName);
        Assert.Equal("bob@example.com", result.ContactEmail);
        Assert.Equal("555-1234", result.ContactPhone);
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_venue_not_found()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_for_wrong_org()
    {
        var repo = new FakeVenueRepository();
        var venue = MakeVenue();
        repo.Seed(venue);
        var service = new VenueService(repo);
        var otherOrgId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(venue.Id, otherOrgId));
    }

    [Fact]
    public async Task CreateAsync_returns_dto_with_all_fields_and_new_id()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);
        var req = new SaveVenueRequest("City Hall", "1 Main St", "Bob", "bob@example.com", "555-1234");

        var result = await service.CreateAsync(OrgId, req);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("City Hall", result.Name);
        Assert.Equal("1 Main St", result.Address);
        Assert.Equal("Bob", result.ContactName);
        Assert.Equal("bob@example.com", result.ContactEmail);
        Assert.Equal("555-1234", result.ContactPhone);
    }

    [Fact]
    public async Task CreateAsync_persists_venue_so_it_can_be_retrieved()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);
        var req = new SaveVenueRequest("Grand Ballroom", "2 Oak Ave", null, null, null);

        var created = await service.CreateAsync(OrgId, req);
        var fetched = await service.GetAsync(created.Id, OrgId);

        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal("Grand Ballroom", fetched.Name);
    }

    [Fact]
    public async Task UpdateAsync_returns_updated_dto_with_new_field_values()
    {
        var repo = new FakeVenueRepository();
        var venue = MakeVenue("Old Name", "Old Address");
        repo.Seed(venue);
        var service = new VenueService(repo);
        var req = new SaveVenueRequest("New Name", "New Address", "Alice", "alice@example.com", "555-9999");

        var result = await service.UpdateAsync(venue.Id, OrgId, req);

        Assert.Equal(venue.Id, result.Id);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("New Address", result.Address);
        Assert.Equal("Alice", result.ContactName);
    }

    [Fact]
    public async Task UpdateAsync_throws_NotFoundException_when_venue_not_found()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);
        var req = new SaveVenueRequest("Name", "Address", null, null, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateAsync(Guid.NewGuid(), OrgId, req));
    }

    [Fact]
    public async Task DeleteAsync_removes_venue_so_subsequent_get_throws()
    {
        var repo = new FakeVenueRepository();
        var venue = MakeVenue();
        repo.Seed(venue);
        var service = new VenueService(repo);

        await service.DeleteAsync(venue.Id, OrgId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(venue.Id, OrgId));
    }

    [Fact]
    public async Task DeleteAsync_throws_NotFoundException_when_venue_not_found()
    {
        var repo = new FakeVenueRepository();
        var service = new VenueService(repo);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.DeleteAsync(Guid.NewGuid(), OrgId));
    }
}
