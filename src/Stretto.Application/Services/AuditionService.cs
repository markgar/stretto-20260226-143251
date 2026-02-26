using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Application.Services;

public class AuditionService : IAuditionService
{
    private readonly IRepository<AuditionDate> _dates;
    private readonly IRepository<AuditionSlot> _slots;

    public AuditionService(IRepository<AuditionDate> dates, IRepository<AuditionSlot> slots)
    {
        _dates = dates;
        _slots = slots;
    }

    public async Task<List<AuditionDateDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)
    {
        var dates = await _dates.ListAsync(orgId, d => d.ProgramYearId == programYearId);
        var result = new List<AuditionDateDto>();
        foreach (var date in dates)
        {
            var slots = await _slots.ListAsync(orgId, s => s.AuditionDateId == date.Id);
            result.Add(ToDto(date, slots));
        }
        return result;
    }

    public async Task<AuditionDateDto> GetAsync(Guid id, Guid orgId)
    {
        var date = await _dates.GetByIdAsync(id, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");
        var slots = await _slots.ListAsync(orgId, s => s.AuditionDateId == date.Id);
        return ToDto(date, slots);
    }

    public async Task<AuditionDateDto> CreateAsync(Guid orgId, CreateAuditionDateRequest req)
    {
        var totalMinutes = (req.EndTime - req.StartTime).TotalMinutes;
        if (totalMinutes <= 0 || totalMinutes % req.BlockLengthMinutes != 0)
            throw new ValidationException("Block length does not divide evenly into the audition window");

        var date = new AuditionDate
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ProgramYearId = req.ProgramYearId,
            Date = req.Date,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            BlockLengthMinutes = req.BlockLengthMinutes
        };
        await _dates.AddAsync(date);

        var slotCount = (int)(totalMinutes / req.BlockLengthMinutes);
        var generatedSlots = new List<AuditionSlot>();
        for (int i = 0; i < slotCount; i++)
        {
            var slot = new AuditionSlot
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                AuditionDateId = date.Id,
                SlotTime = req.StartTime.AddMinutes(i * req.BlockLengthMinutes),
                Status = AuditionStatus.Pending
            };
            await _slots.AddAsync(slot);
            generatedSlots.Add(slot);
        }

        return ToDto(date, generatedSlots);
    }

    public async Task DeleteAsync(Guid id, Guid orgId)
    {
        var date = await _dates.GetByIdAsync(id, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");
        var slots = await _slots.ListAsync(orgId, s => s.AuditionDateId == date.Id);
        foreach (var slot in slots)
            await _slots.DeleteAsync(slot);
        await _dates.DeleteAsync(date);
    }

    public async Task<AuditionSlotDto> UpdateSlotStatusAsync(Guid dateId, Guid slotId, Guid orgId, string status)
    {
        var date = await _dates.GetByIdAsync(dateId, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");
        var slot = await _slots.GetByIdAsync(slotId, orgId);
        if (slot is null || slot.AuditionDateId != dateId)
            throw new NotFoundException("Audition slot not found");
        if (!Enum.TryParse<AuditionStatus>(status, out var parsed))
            throw new ValidationException($"Invalid status: {status}");
        slot.Status = parsed;
        await _slots.UpdateAsync(slot);
        return ToSlotDto(slot);
    }

    public async Task<AuditionSlotDto> UpdateSlotNotesAsync(Guid dateId, Guid slotId, Guid orgId, string? notes)
    {
        var date = await _dates.GetByIdAsync(dateId, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");
        var slot = await _slots.GetByIdAsync(slotId, orgId);
        if (slot is null || slot.AuditionDateId != dateId)
            throw new NotFoundException("Audition slot not found");
        slot.Notes = notes;
        await _slots.UpdateAsync(slot);
        return ToSlotDto(slot);
    }

    private static AuditionDateDto ToDto(AuditionDate d, List<AuditionSlot> slots) =>
        new(d.Id, d.ProgramYearId, d.Date, d.StartTime, d.EndTime, d.BlockLengthMinutes,
            slots.Select(ToSlotDto).ToList());

    private static AuditionSlotDto ToSlotDto(AuditionSlot s) =>
        new(s.Id, s.AuditionDateId, s.SlotTime, s.MemberId, s.Status.ToString(), s.Notes);
}
