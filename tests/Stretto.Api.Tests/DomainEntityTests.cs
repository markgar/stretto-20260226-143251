using System.Reflection;
using Stretto.Application.Exceptions;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Api.Tests;

/// <summary>
/// Tests for domain entities, enums, and application exceptions added in
/// the "Domain Entities + Application Interfaces" milestone.
/// </summary>
public class DomainEntityTests
{
    // ── Multi-tenancy: every entity (except Organization) must carry OrganizationId ──

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
        // Organization is the tenant root — it should not reference itself.
        var prop = typeof(Organization).GetProperty("OrganizationId");
        Assert.Null(prop);
    }

    // ── Organization entity ──

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

    // ── Member entity ──

    [Fact]
    public void Member_role_defaults_to_first_enum_value_and_IsActive_defaults_to_false()
    {
        var member = new Member();
        Assert.Equal(Role.Admin, member.Role); // default(Role) == 0 == Admin
        Assert.False(member.IsActive);
    }

    // ── Venue optional contact fields ──

    [Fact]
    public void Venue_contact_fields_are_nullable()
    {
        var venue = new Venue { Id = Guid.NewGuid(), Name = "Concert Hall", Address = "123 Main St", OrganizationId = Guid.NewGuid() };
        Assert.Null(venue.ContactName);
        Assert.Null(venue.ContactEmail);
        Assert.Null(venue.ContactPhone);
    }

    // ── Event: VenueId is optional ──

    [Fact]
    public void Event_VenueId_is_nullable()
    {
        var ev = new Stretto.Domain.Entities.Event();
        Assert.Null(ev.VenueId);
    }

    // ── AuditionSlot: MemberId and Notes are optional ──

    [Fact]
    public void AuditionSlot_optional_fields_default_to_null()
    {
        var slot = new AuditionSlot();
        Assert.Null(slot.MemberId);
        Assert.Null(slot.Notes);
    }

    // ── Enums have the values specified in the milestone ──

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

/// <summary>
/// Tests for Application-layer exceptions.
/// </summary>
public class ApplicationExceptionTests
{
    [Fact]
    public void NotFoundException_inherits_from_Exception()
    {
        var ex = new NotFoundException("Resource not found");
        Assert.IsAssignableFrom<Exception>(ex);
    }

    [Fact]
    public void NotFoundException_preserves_message()
    {
        var ex = new NotFoundException("Member with id 123 not found");
        Assert.Equal("Member with id 123 not found", ex.Message);
    }

    [Fact]
    public void ValidationException_inherits_from_Exception()
    {
        var ex = new Stretto.Application.Exceptions.ValidationException(
            new Dictionary<string, string[]> { ["email"] = ["Email is required"] });
        Assert.IsAssignableFrom<Exception>(ex);
    }

    [Fact]
    public void ValidationException_exposes_errors_dictionary()
    {
        var errors = new Dictionary<string, string[]>
        {
            ["firstName"] = ["First name is required"],
            ["email"] = ["Email is required", "Email must be valid"],
        };
        var ex = new Stretto.Application.Exceptions.ValidationException(errors);

        Assert.Equal(2, ex.Errors.Count);
        Assert.Equal(["First name is required"], ex.Errors["firstName"]);
        Assert.Equal(["Email is required", "Email must be valid"], ex.Errors["email"]);
    }

    [Fact]
    public void ValidationException_has_default_message()
    {
        var ex = new Stretto.Application.Exceptions.ValidationException(
            new Dictionary<string, string[]> { ["name"] = ["Required"] });
        Assert.Equal("One or more validation errors occurred.", ex.Message);
    }
}

/// <summary>
/// Tests that verify IRepository interface contract matches the specification.
/// </summary>
public class RepositoryInterfaceTests
{
    private static readonly Type RepoInterface = typeof(Stretto.Application.Interfaces.IRepository<>);

    [Fact]
    public void IRepository_is_generic_interface()
    {
        Assert.True(RepoInterface.IsInterface);
        Assert.True(RepoInterface.IsGenericTypeDefinition);
    }

    [Fact]
    public void IRepository_defines_all_required_methods()
    {
        var methods = RepoInterface.GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("GetByIdAsync", methods);
        Assert.Contains("ListAsync", methods);
        Assert.Contains("AddAsync", methods);
        Assert.Contains("UpdateAsync", methods);
        Assert.Contains("DeleteAsync", methods);
    }

    [Fact]
    public void IStorageProvider_defines_all_required_methods()
    {
        var methods = typeof(Stretto.Application.Interfaces.IStorageProvider)
            .GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("SaveAsync", methods);
        Assert.Contains("GetAsync", methods);
        Assert.Contains("DeleteAsync", methods);
    }

    [Fact]
    public void INotificationProvider_defines_SendAsync()
    {
        var methods = typeof(Stretto.Application.Interfaces.INotificationProvider)
            .GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("SendAsync", methods);
    }
}
