using Microsoft.EntityFrameworkCore;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Organizations.AnyAsync())
            return;

        var org = new Organization
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "My Choir",
            CreatedAt = DateTime.UtcNow
        };
        db.Organizations.Add(org);

        db.Members.Add(new Member
        {
            Id = Guid.NewGuid(),
            Email = "mgarner22@gmail.com",
            FirstName = "Admin",
            LastName = "User",
            Role = Role.Admin,
            IsActive = true,
            OrganizationId = org.Id
        });

        db.Members.Add(new Member
        {
            Id = Guid.NewGuid(),
            Email = "mgarner@outlook.com",
            FirstName = "Member",
            LastName = "User",
            Role = Role.Member,
            IsActive = true,
            OrganizationId = org.Id
        });

        db.ProgramYears.Add(new ProgramYear
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "2025-2026",
            StartDate = new DateOnly(2025, 9, 1),
            EndDate = new DateOnly(2026, 6, 30),
            IsCurrent = true,
            IsArchived = false,
            OrganizationId = org.Id
        });

        await db.SaveChangesAsync();
    }
}
