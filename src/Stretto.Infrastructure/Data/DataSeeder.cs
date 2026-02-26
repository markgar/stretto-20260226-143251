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
            Email = "admin@example.com",
            FirstName = "Admin",
            LastName = "User",
            Role = Role.Admin,
            IsActive = true,
            OrganizationId = org.Id
        });

        db.Members.Add(new Member
        {
            Id = Guid.NewGuid(),
            Email = "member@example.com",
            FirstName = "Member",
            LastName = "User",
            Role = Role.Member,
            IsActive = true,
            OrganizationId = org.Id
        });

        await db.SaveChangesAsync();
    }
}
