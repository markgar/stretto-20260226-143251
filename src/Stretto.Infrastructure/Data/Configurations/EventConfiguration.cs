using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;
using Stretto.Domain.Enums;

namespace Stretto.Infrastructure.Data.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ProjectId).IsRequired();
        builder.Property(e => e.EventType)
            .IsRequired()
            .HasConversion(t => t.ToString(), s => Enum.Parse<EventType>(s));
        builder.Property(e => e.Date).IsRequired();
        builder.Property(e => e.StartTime).IsRequired();
        builder.Property(e => e.DurationMinutes).IsRequired();
        builder.Property(e => e.VenueId);
        builder.Property(e => e.OrganizationId).IsRequired();
    }
}
