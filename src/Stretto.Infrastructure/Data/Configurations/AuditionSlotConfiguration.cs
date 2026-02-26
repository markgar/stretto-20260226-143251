using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data.Configurations;

public class AuditionSlotConfiguration : IEntityTypeConfiguration<AuditionSlot>
{
    public void Configure(EntityTypeBuilder<AuditionSlot> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.AuditionDateId).IsRequired();
        builder.Property(a => a.SlotTime).IsRequired();
        builder.Property(a => a.MemberId);
        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion(s => s.ToString(), s => Enum.Parse<AuditionStatus>(s));
        builder.Property(a => a.Notes);
        builder.Property(a => a.OrganizationId).IsRequired();
    }
}
