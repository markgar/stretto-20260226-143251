using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data.Configurations;

public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.EventId).IsRequired();
        builder.Property(a => a.MemberId).IsRequired();
        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion(s => s.ToString(), s => Enum.Parse<AttendanceStatus>(s));
        builder.Property(a => a.OrganizationId).IsRequired();
    }
}
