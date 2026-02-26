using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Organizations.Any())
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

        await db.SaveChangesAsync();
    }
}
