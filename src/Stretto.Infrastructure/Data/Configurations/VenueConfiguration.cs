using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class VenueConfiguration : IEntityTypeConfiguration<Venue>
{
    public void Configure(EntityTypeBuilder<Venue> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Name).IsRequired().HasMaxLength(255);
        builder.Property(v => v.Address).IsRequired().HasMaxLength(255);
        builder.Property(v => v.ContactName).HasMaxLength(200);
        builder.Property(v => v.ContactEmail).HasMaxLength(255);
        builder.Property(v => v.ContactPhone).HasMaxLength(50);
        builder.Property(v => v.OrganizationId).IsRequired();
    }
}
