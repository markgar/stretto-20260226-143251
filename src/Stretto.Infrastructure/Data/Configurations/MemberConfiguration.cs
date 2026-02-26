using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.FirstName).IsRequired().HasMaxLength(255);
        builder.Property(m => m.LastName).IsRequired().HasMaxLength(255);
        builder.Property(m => m.Email).IsRequired().HasMaxLength(255);
        builder.Property(m => m.Role)
            .IsRequired()
            .HasConversion(r => r.ToString(), s => Enum.Parse<Role>(s));
        builder.Property(m => m.IsActive).IsRequired();
        builder.Property(m => m.OrganizationId).IsRequired();
    }
}
