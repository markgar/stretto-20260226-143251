using Microsoft.EntityFrameworkCore;
using Stretto.Application.DTOs;
using Stretto.Application.Exceptions;
using Stretto.Application.Services;
using Stretto.Domain.Entities;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for AuditionService — verifies create, list, get, delete,
/// slot status update, and slot notes update business logic using real
/// repositories backed by an in-memory database.
/// </summary>
public class AuditionServiceTests : IDisposable
{
    private static readonly Guid OrgId = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
    private readonly AppDbContext _db;
    private readonly AuditionService _service;

    public AuditionServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("AuditionServiceTests-" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
        var dates = new BaseRepository<AuditionDate>(_db);
        var slots = new BaseRepository<AuditionSlot>(_db);
        _service = new AuditionService(dates, slots);
    }

    public void Dispose() => _db.Dispose();

    private CreateAuditionDateRequest DefaultRequest(Guid? programYearId = null) =>
        new(
            programYearId ?? Guid.NewGuid(),
            new DateOnly(2026, 6, 1),
            new TimeOnly(9, 0),
            new TimeOnly(12, 0),
            30
        );

    // CreateAsync

    [Fact]
    public async Task CreateAsync_returns_dto_with_correct_slot_count()
    {
        var req = DefaultRequest();

        var result = await _service.CreateAsync(OrgId, req);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(6, result.Slots.Count);
    }

    [Fact]
    public async Task CreateAsync_generates_slots_with_correct_times()
    {
        var req = DefaultRequest();

        var result = await _service.CreateAsync(OrgId, req);

        Assert.Equal(new TimeOnly(9, 0), result.Slots[0].SlotTime);
        Assert.Equal(new TimeOnly(9, 30), result.Slots[1].SlotTime);
        Assert.Equal(new TimeOnly(11, 30), result.Slots[5].SlotTime);
    }

    [Fact]
    public async Task CreateAsync_slots_start_with_pending_status_and_null_notes()
    {
        var req = DefaultRequest();

        var result = await _service.CreateAsync(OrgId, req);

        Assert.All(result.Slots, s =>
        {
            Assert.Equal("Pending", s.Status);
            Assert.Null(s.Notes);
        });
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_start_not_before_end()
    {
        var req = new CreateAuditionDateRequest(
            Guid.NewGuid(),
            new DateOnly(2026, 6, 1),
            new TimeOnly(12, 0),
            new TimeOnly(9, 0),
            30
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("startTime"));
    }

    [Fact]
    public async Task CreateAsync_throws_ValidationException_when_block_length_does_not_divide_duration()
    {
        var req = new CreateAuditionDateRequest(
            Guid.NewGuid(),
            new DateOnly(2026, 6, 1),
            new TimeOnly(9, 0),
            new TimeOnly(12, 0),
            35
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(OrgId, req));

        Assert.True(ex.Errors.ContainsKey("blockLengthMinutes"));
    }

    // GetAsync

    [Fact]
    public async Task GetAsync_returns_audition_date_with_slots()
    {
        var req = DefaultRequest();
        var created = await _service.CreateAsync(OrgId, req);

        var result = await _service.GetAsync(created.Id, OrgId);

        Assert.Equal(created.Id, result.Id);
        Assert.Equal(req.Date, result.Date);
        Assert.Equal(req.BlockLengthMinutes, result.BlockLengthMinutes);
        Assert.Equal(6, result.Slots.Count);
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_audition_date_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(Guid.NewGuid(), OrgId));
    }

    // ListByProgramYearAsync

    [Fact]
    public async Task ListByProgramYearAsync_returns_dates_for_program_year()
    {
        var programYearId = Guid.NewGuid();
        var req = DefaultRequest(programYearId);
        await _service.CreateAsync(OrgId, req);

        var result = await _service.ListByProgramYearAsync(programYearId, OrgId);

        Assert.Single(result);
        Assert.Equal(programYearId, result[0].ProgramYearId);
    }

    [Fact]
    public async Task ListByProgramYearAsync_returns_empty_when_no_dates_for_program_year()
    {
        var result = await _service.ListByProgramYearAsync(Guid.NewGuid(), OrgId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task ListByProgramYearAsync_each_date_includes_its_slots()
    {
        var programYearId = Guid.NewGuid();
        await _service.CreateAsync(OrgId, DefaultRequest(programYearId));

        var result = await _service.ListByProgramYearAsync(programYearId, OrgId);

        Assert.Equal(6, result[0].Slots.Count);
    }

    // DeleteAsync

    [Fact]
    public async Task DeleteAsync_removes_audition_date_so_subsequent_get_throws()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());

        await _service.DeleteAsync(created.Id, OrgId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetAsync(created.Id, OrgId));
    }

    [Fact]
    public async Task DeleteAsync_also_removes_associated_slots()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());
        var slotId = created.Slots[0].Id;

        await _service.DeleteAsync(created.Id, OrgId);

        var remainingSlots = _db.Set<AuditionSlot>().Where(s => s.AuditionDateId == created.Id).ToList();
        Assert.Empty(remainingSlots);
    }

    [Fact]
    public async Task DeleteAsync_throws_NotFoundException_when_audition_date_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteAsync(Guid.NewGuid(), OrgId));
    }

    // UpdateSlotStatusAsync

    [Fact]
    public async Task UpdateSlotStatusAsync_updates_slot_status_to_accepted()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());
        var slotId = created.Slots[0].Id;

        var result = await _service.UpdateSlotStatusAsync(slotId, OrgId, "Accepted");

        Assert.Equal("Accepted", result.Status);
    }

    [Fact]
    public async Task UpdateSlotStatusAsync_throws_NotFoundException_when_slot_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateSlotStatusAsync(Guid.NewGuid(), OrgId, "Accepted"));
    }

    [Fact]
    public async Task UpdateSlotStatusAsync_throws_ValidationException_for_invalid_status()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());
        var slotId = created.Slots[0].Id;

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateSlotStatusAsync(slotId, OrgId, "NotAStatus"));

        Assert.True(ex.Errors.ContainsKey("status"));
    }

    // UpdateSlotNotesAsync

    [Fact]
    public async Task UpdateSlotNotesAsync_updates_slot_notes()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());
        var slotId = created.Slots[0].Id;

        var result = await _service.UpdateSlotNotesAsync(slotId, OrgId, "Strong vocalist");

        Assert.Equal("Strong vocalist", result.Notes);
    }

    [Fact]
    public async Task UpdateSlotNotesAsync_clears_notes_when_null_is_passed()
    {
        var created = await _service.CreateAsync(OrgId, DefaultRequest());
        var slotId = created.Slots[0].Id;
        await _service.UpdateSlotNotesAsync(slotId, OrgId, "initial note");

        var result = await _service.UpdateSlotNotesAsync(slotId, OrgId, null);

        Assert.Null(result.Notes);
    }

    [Fact]
    public async Task UpdateSlotNotesAsync_throws_NotFoundException_when_slot_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateSlotNotesAsync(Guid.NewGuid(), OrgId, "notes"));
    }
}
