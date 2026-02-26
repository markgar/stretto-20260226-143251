using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class AuditionDateConfiguration : IEntityTypeConfiguration<AuditionDate>
{
    public void Configure(EntityTypeBuilder<AuditionDate> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ProgramYearId).IsRequired();
        builder.Property(a => a.StartTime).IsRequired();
        builder.Property(a => a.EndTime).IsRequired();
        builder.Property(a => a.BlockLengthMinutes).IsRequired();
        builder.Property(a => a.OrganizationId).IsRequired();
    }
}
