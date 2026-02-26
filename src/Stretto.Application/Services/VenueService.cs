using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class VenueService
{
    private readonly IRepository<Venue> _venues;

    public VenueService(IRepository<Venue> venues)
    {
        _venues = venues;
    }

    public async Task<List<VenueDto>> ListAsync(Guid orgId)
    {
        var venues = await _venues.ListAsync(orgId);
        return venues.Select(ToDto).ToList();
    }

    public async Task<VenueDto> GetAsync(Guid id, Guid orgId)
    {
        var venue = await _venues.GetByIdAsync(id, orgId);
        if (venue is null)
            throw new NotFoundException("Venue not found");
        return ToDto(venue);
    }

    public async Task<VenueDto> CreateAsync(Guid orgId, SaveVenueRequest req)
    {
        var venue = new Venue
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = req.Name,
            Address = req.Address,
            ContactName = req.ContactName,
            ContactEmail = req.ContactEmail,
            ContactPhone = req.ContactPhone
        };
        await _venues.AddAsync(venue);
        return ToDto(venue);
    }

    public async Task<VenueDto> UpdateAsync(Guid id, Guid orgId, SaveVenueRequest req)
    {
        var venue = await _venues.GetByIdAsync(id, orgId);
        if (venue is null)
            throw new NotFoundException("Venue not found");

        venue.Name = req.Name;
        venue.Address = req.Address;
        venue.ContactName = req.ContactName;
        venue.ContactEmail = req.ContactEmail;
        venue.ContactPhone = req.ContactPhone;

        await _venues.UpdateAsync(venue);
        return ToDto(venue);
    }

    public async Task DeleteAsync(Guid id, Guid orgId)
    {
        var venue = await _venues.GetByIdAsync(id, orgId);
        if (venue is null)
            throw new NotFoundException("Venue not found");
        await _venues.DeleteAsync(venue);
    }

    private static VenueDto ToDto(Venue v) =>
        new(v.Id, v.Name, v.Address, v.ContactName, v.ContactEmail, v.ContactPhone);
}
