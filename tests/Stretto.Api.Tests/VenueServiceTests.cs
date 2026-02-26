using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Api.Tests;

/// <summary>
/// Unit tests for VenueService — verifies CRUD business logic using a real
/// BaseRepository<Venue> backed by EF Core in-memory database.
/// </summary>
public class VenueServiceTests
{
    private static readonly Guid OrgId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static (VenueService service, AppDbContext ctx) CreateService()
    {
        var ctx = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        var repo = new BaseRepository<Venue>(ctx);
        return (new VenueService(repo), ctx);
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
        var (service, ctx) = CreateService();
        ctx.Venues.AddRange(MakeVenue("City Hall"), MakeVenue("Grand Ballroom", "2 Oak Ave"));
        await ctx.SaveChangesAsync();

        var result = await service.ListAsync(OrgId);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, v => v.Name == "City Hall");
        Assert.Contains(result, v => v.Name == "Grand Ballroom");
    }

    [Fact]
    public async Task ListAsync_returns_empty_list_when_no_venues_exist()
    {
        var (service, _) = CreateService();

        var result = await service.ListAsync(OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAsync_returns_venue_dto_for_existing_venue()
    {
        var (service, ctx) = CreateService();
        var venue = MakeVenue("City Hall");
        ctx.Venues.Add(venue);
        await ctx.SaveChangesAsync();

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
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(Guid.NewGuid(), OrgId));
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_for_wrong_org()
    {
        var (service, ctx) = CreateService();
        var venue = MakeVenue();
        ctx.Venues.Add(venue);
        await ctx.SaveChangesAsync();
        var otherOrgId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(venue.Id, otherOrgId));
    }

    [Fact]
    public async Task CreateAsync_returns_dto_with_all_fields_and_new_id()
    {
        var (service, _) = CreateService();
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
        var (service, _) = CreateService();
        var req = new SaveVenueRequest("Grand Ballroom", "2 Oak Ave", null, null, null);

        var created = await service.CreateAsync(OrgId, req);
        var fetched = await service.GetAsync(created.Id, OrgId);

        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal("Grand Ballroom", fetched.Name);
    }

    [Fact]
    public async Task UpdateAsync_persists_new_field_values()
    {
        var (service, ctx) = CreateService();
        var venue = MakeVenue("Old Name", "Old Address");
        ctx.Venues.Add(venue);
        await ctx.SaveChangesAsync();
        var req = new SaveVenueRequest("New Name", "New Address", "Alice", "alice@example.com", "555-9999");

        var result = await service.UpdateAsync(venue.Id, OrgId, req);

        Assert.Equal(venue.Id, result.Id);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("New Address", result.Address);
        Assert.Equal("Alice", result.ContactName);

        var fetched = await service.GetAsync(venue.Id, OrgId);
        Assert.Equal("New Name", fetched.Name);
    }

    [Fact]
    public async Task UpdateAsync_throws_NotFoundException_when_venue_not_found()
    {
        var (service, _) = CreateService();
        var req = new SaveVenueRequest("Name", "Address", null, null, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateAsync(Guid.NewGuid(), OrgId, req));
    }

    [Fact]
    public async Task DeleteAsync_removes_venue_so_subsequent_get_throws()
    {
        var (service, ctx) = CreateService();
        var venue = MakeVenue();
        ctx.Venues.Add(venue);
        await ctx.SaveChangesAsync();

        await service.DeleteAsync(venue.Id, OrgId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetAsync(venue.Id, OrgId));
    }

    [Fact]
    public async Task DeleteAsync_throws_NotFoundException_when_venue_not_found()
    {
        var (service, _) = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.DeleteAsync(Guid.NewGuid(), OrgId));
    }
}
