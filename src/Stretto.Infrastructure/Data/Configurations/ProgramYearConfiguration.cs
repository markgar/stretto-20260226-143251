using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class ProgramYearConfiguration : IEntityTypeConfiguration<ProgramYear>
{
    public void Configure(EntityTypeBuilder<ProgramYear> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(255);
        builder.Property(p => p.StartDate).IsRequired();
        builder.Property(p => p.EndDate).IsRequired();
        builder.Property(p => p.IsCurrent).IsRequired();
        builder.Property(p => p.IsArchived).IsRequired();
        builder.Property(p => p.OrganizationId).IsRequired();
    }
}
