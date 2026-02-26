using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;

namespace Stretto.Application.Services;

public class EventService : IEventService
{
    private readonly IRepository<Event> _events;
    private readonly IRepository<Project> _projects;
    private readonly IRepository<Venue> _venues;

    public EventService(IRepository<Event> events, IRepository<Project> projects, IRepository<Venue> venues)
    {
        _events = events;
        _projects = projects;
        _venues = venues;
    }

    public async Task<List<EventDto>> ListByProjectAsync(Guid projectId, Guid orgId)
    {
        var events = await _events.ListAsync(orgId, e => e.ProjectId == projectId);
        var venueList = await _venues.ListAsync(orgId);
        var venueMap = venueList.ToDictionary(v => v.Id, v => v.Name);
        return events.Select(e => ToDto(e, venueMap)).ToList();
    }

    public async Task<EventDto> GetAsync(Guid id, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(id, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");
        var venueList = await _venues.ListAsync(orgId);
        var venueMap = venueList.ToDictionary(v => v.Id, v => v.Name);
        return ToDto(ev, venueMap);
    }

    public async Task<EventDto> CreateAsync(Guid orgId, CreateEventRequest req)
    {
        var project = await _projects.GetByIdAsync(req.ProjectId, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        if (req.Date < project.StartDate || req.Date > project.EndDate)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["date"] = ["Event date must fall within the project date range"]
            });

        var ev = new Event
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProjectId = req.ProjectId,
            EventType = req.Type,
            Date = req.Date,
            StartTime = req.StartTime,
            DurationMinutes = req.DurationMinutes,
            VenueId = req.VenueId
        };
        await _events.AddAsync(ev);

        var venueList = await _venues.ListAsync(orgId);
        var venueMap = venueList.ToDictionary(v => v.Id, v => v.Name);
        return ToDto(ev, venueMap);
    }

    public async Task<EventDto> UpdateAsync(Guid id, Guid orgId, UpdateEventRequest req)
    {
        var ev = await _events.GetByIdAsync(id, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");

        var project = await _projects.GetByIdAsync(ev.ProjectId, orgId);
        if (project is null)
            throw new NotFoundException("Project not found");

        if (req.Date < project.StartDate || req.Date > project.EndDate)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["date"] = ["Event date must fall within the project date range"]
            });

        ev.EventType = req.Type;
        ev.Date = req.Date;
        ev.StartTime = req.StartTime;
        ev.DurationMinutes = req.DurationMinutes;
        ev.VenueId = req.VenueId;

        await _events.UpdateAsync(ev);

        var venueList = await _venues.ListAsync(orgId);
        var venueMap = venueList.ToDictionary(v => v.Id, v => v.Name);
        return ToDto(ev, venueMap);
    }

    public async Task DeleteAsync(Guid id, Guid orgId)
    {
        var ev = await _events.GetByIdAsync(id, orgId);
        if (ev is null)
            throw new NotFoundException("Event not found");
        await _events.DeleteAsync(ev);
    }

    private static EventDto ToDto(Event e, Dictionary<Guid, string> venueMap)
    {
        var venueName = e.VenueId.HasValue && venueMap.TryGetValue(e.VenueId.Value, out var name) ? name : null;
        return new EventDto(e.Id, e.ProjectId, e.EventType, e.Date, e.StartTime, e.DurationMinutes, e.VenueId, venueName);
    }
}
