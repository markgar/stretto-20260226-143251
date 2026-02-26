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
    private readonly IRepository<Member> _members;

    public AuditionService(IRepository<AuditionDate> dates, IRepository<AuditionSlot> slots, IRepository<Member> members)
    {
        _dates = dates;
        _slots = slots;
        _members = members;
    }

    public async Task<List<AuditionDateDto>> ListByProgramYearAsync(Guid programYearId, Guid orgId)
    {
        var dates = await _dates.ListAsync(orgId, d => d.ProgramYearId == programYearId);
        var dateIds = dates.Select(d => d.Id).ToHashSet();
        var allSlots = await _slots.ListAsync(orgId, s => dateIds.Contains(s.AuditionDateId));
        var slotsByDate = allSlots.GroupBy(s => s.AuditionDateId)
            .ToDictionary(g => g.Key, g => g.OrderBy(s => s.SlotTime).ToList());

        return dates.Select(d =>
        {
            var slots = slotsByDate.TryGetValue(d.Id, out var list) ? list : new List<AuditionSlot>();
            return ToDto(d, slots);
        }).ToList();
    }

    public async Task<AuditionDateDto> GetAsync(Guid id, Guid orgId)
    {
        var date = await _dates.GetByIdAsync(id, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");

        var slots = await _slots.ListAsync(orgId, s => s.AuditionDateId == id);
        return ToDto(date, slots.OrderBy(s => s.SlotTime).ToList());
    }

    public async Task<AuditionDateDto> CreateAsync(Guid orgId, CreateAuditionDateRequest req)
    {
        if (req.BlockLengthMinutes <= 0)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["blockLengthMinutes"] = ["Block length must be a positive number"]
            });

        if (req.StartTime >= req.EndTime)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["startTime"] = ["Start time must be before end time"]
            });

        if (req.BlockLengthMinutes <= 0)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["blockLengthMinutes"] = ["Block length must be a positive number"]
            });

        var totalMinutes = (int)(req.EndTime - req.StartTime).TotalMinutes;
        if (totalMinutes % req.BlockLengthMinutes != 0)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["blockLengthMinutes"] = ["Block length must evenly divide the total duration"]
            });

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

        var slotCount = totalMinutes / req.BlockLengthMinutes;
        var slots = new List<AuditionSlot>();
        for (var i = 0; i < slotCount; i++)
        {
            var slot = new AuditionSlot
            {
                Id = Guid.NewGuid(),
                AuditionDateId = date.Id,
                OrganizationId = orgId,
                SlotTime = req.StartTime.AddMinutes(i * req.BlockLengthMinutes),
                Status = AuditionStatus.Pending
            };
            await _slots.AddAsync(slot);
            slots.Add(slot);
        }

        return ToDto(date, slots);
    }

    public async Task DeleteAsync(Guid id, Guid orgId)
    {
        var date = await _dates.GetByIdAsync(id, orgId);
        if (date is null)
            throw new NotFoundException("Audition date not found");

        var slots = await _slots.ListAsync(orgId, s => s.AuditionDateId == id);
        foreach (var slot in slots)
            await _slots.DeleteAsync(slot);

        await _dates.DeleteAsync(date);
    }

    public async Task<AuditionSlotDto> UpdateSlotStatusAsync(Guid slotId, Guid orgId, string status)
    {
        var slot = await _slots.GetByIdAsync(slotId, orgId);
        if (slot is null)
            throw new NotFoundException("Audition slot not found");

        if (!Enum.TryParse<AuditionStatus>(status, ignoreCase: true, out var parsed))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["status"] = ["Invalid status value"]
            });

        slot.Status = parsed;
        await _slots.UpdateAsync(slot);
        return ToSlotDto(slot);
    }

    public async Task<AuditionSlotDto> UpdateSlotNotesAsync(Guid slotId, Guid orgId, string? notes)
    {
        var slot = await _slots.GetByIdAsync(slotId, orgId);
        if (slot is null)
            throw new NotFoundException("Audition slot not found");

        slot.Notes = notes;
        await _slots.UpdateAsync(slot);
        return ToSlotDto(slot);
    }

    private static AuditionSlotDto ToSlotDto(AuditionSlot slot) =>
        new(slot.Id, slot.AuditionDateId, slot.SlotTime, slot.MemberId, slot.Status.ToString(), slot.Notes);

    private static AuditionDateDto ToDto(AuditionDate date, List<AuditionSlot> slots) =>
        new(date.Id, date.ProgramYearId, date.Date, date.StartTime, date.EndTime, date.BlockLengthMinutes,
            slots.Select(ToSlotDto).ToList());

    public async Task<PublicAuditionDateDto> GetPublicAuditionDateAsync(Guid auditionDateId)
    {
        var date = await _dates.FindOneAsync(d => d.Id == auditionDateId);
        if (date is null)
            throw new NotFoundException("Audition date not found");

        var slots = await _slots.ListAsync(date.OrganizationId, s => s.AuditionDateId == auditionDateId);
        var publicSlots = slots
            .OrderBy(s => s.SlotTime)
            .Select(s => new PublicAuditionSlotDto(s.Id, s.SlotTime, s.MemberId == null && s.Status == AuditionStatus.Pending))
            .ToList();

        return new PublicAuditionDateDto(date.Id, date.Date, date.StartTime, date.EndTime, date.BlockLengthMinutes, publicSlots);
    }

    public async Task<AuditionSlotDto> SignUpForSlotAsync(Guid slotId, AuditionSignUpRequest req)
    {
        var slot = await _slots.FindOneAsync(s => s.Id == slotId);
        if (slot is null)
            throw new NotFoundException("Audition slot not found");

        if (slot.Status != AuditionStatus.Pending)
            throw new UnprocessableEntityException("This slot is no longer available");

        if (slot.MemberId != null)
            throw new UnprocessableEntityException("This slot has already been claimed");

        if (string.IsNullOrWhiteSpace(req.Email))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required"]
            });

        var member = await _members.FindOneAsync(
            m => m.OrganizationId == slot.OrganizationId && m.Email.ToLower() == req.Email.Trim().ToLower());

        if (member is null)
        {
            member = new Member
            {
                Id = Guid.NewGuid(),
                OrganizationId = slot.OrganizationId,
                FirstName = req.FirstName.Trim(),
                LastName = req.LastName.Trim(),
                Email = req.Email.Trim(),
                Role = Role.Member,
                IsActive = true
            };
            await _members.AddAsync(member);
        }

        slot.MemberId = member.Id;
        await _slots.UpdateAsync(slot);
        return ToSlotDto(slot);
    }
}
