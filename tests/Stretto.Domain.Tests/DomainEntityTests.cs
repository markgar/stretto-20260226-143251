using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Domain.Tests;

/// <summary>
/// Tests for domain entities and enums.
/// </summary>
public class DomainEntityTests
{
    private static readonly Type[] TenantScopedEntities =
    [
        typeof(Member), typeof(ProgramYear), typeof(Venue), typeof(Project),
        typeof(Stretto.Domain.Entities.Event), typeof(ProjectAssignment),
        typeof(AttendanceRecord), typeof(AuditionDate), typeof(AuditionSlot),
        typeof(ProjectLink), typeof(ProjectDocument),
    ];

    [Theory]
    [MemberData(nameof(GetTenantScopedEntityTypes))]
    public void Entity_has_OrganizationId_property(Type entityType)
    {
        var prop = entityType.GetProperty("OrganizationId");
        Assert.NotNull(prop);
        Assert.Equal(typeof(Guid), prop!.PropertyType);
    }

    public static IEnumerable<object[]> GetTenantScopedEntityTypes() =>
        TenantScopedEntities.Select(t => new object[] { t });

    [Fact]
    public void Organization_does_not_have_OrganizationId()
    {
        var prop = typeof(Organization).GetProperty("OrganizationId");
        Assert.Null(prop);
    }

    [Fact]
    public void Organization_has_required_properties()
    {
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Youth Orchestra",
            CreatedAt = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
        };
        Assert.Equal("Youth Orchestra", org.Name);
        Assert.Equal(new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc), org.CreatedAt);
    }

    [Fact]
    public void Member_role_defaults_to_first_enum_value_and_IsActive_defaults_to_false()
    {
        var member = new Member();
        Assert.Equal(Role.Admin, member.Role);
        Assert.False(member.IsActive);
    }

    [Fact]
    public void Venue_contact_fields_are_nullable()
    {
        var venue = new Venue { Id = Guid.NewGuid(), Name = "Concert Hall", Address = "123 Main St", OrganizationId = Guid.NewGuid() };
        Assert.Null(venue.ContactName);
        Assert.Null(venue.ContactEmail);
        Assert.Null(venue.ContactPhone);
    }

    [Fact]
    public void Event_VenueId_is_nullable()
    {
        var ev = new Stretto.Domain.Entities.Event();
        Assert.Null(ev.VenueId);
    }

    [Fact]
    public void AuditionSlot_optional_fields_default_to_null()
    {
        var slot = new AuditionSlot();
        Assert.Null(slot.MemberId);
        Assert.Null(slot.Notes);
    }

    [Fact]
    public void Role_enum_has_correct_values()
    {
        Assert.Equal(0, (int)Role.Admin);
        Assert.Equal(1, (int)Role.Member);
    }

    [Fact]
    public void EventType_enum_has_correct_values()
    {
        Assert.Equal(0, (int)EventType.Rehearsal);
        Assert.Equal(1, (int)EventType.Performance);
    }

    [Fact]
    public void AttendanceStatus_enum_has_correct_values()
    {
        Assert.Equal(0, (int)AttendanceStatus.Present);
        Assert.Equal(1, (int)AttendanceStatus.Excused);
        Assert.Equal(2, (int)AttendanceStatus.Absent);
    }

    [Fact]
    public void AuditionStatus_enum_has_correct_values()
    {
        Assert.Equal(0, (int)AuditionStatus.Pending);
        Assert.Equal(1, (int)AuditionStatus.Accepted);
        Assert.Equal(2, (int)AuditionStatus.Rejected);
        Assert.Equal(3, (int)AuditionStatus.Waitlisted);
    }
}
