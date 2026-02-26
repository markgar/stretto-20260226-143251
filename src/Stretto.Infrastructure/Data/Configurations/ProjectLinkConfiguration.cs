using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class ProjectLinkConfiguration : IEntityTypeConfiguration<ProjectLink>
{
    public void Configure(EntityTypeBuilder<ProjectLink> builder)
    {
        builder.HasKey(pl => pl.Id);
        builder.Property(pl => pl.ProjectId).IsRequired();
        builder.Property(pl => pl.Title).IsRequired().HasMaxLength(255);
        builder.Property(pl => pl.Url).IsRequired().HasMaxLength(2048);
        builder.Property(pl => pl.OrganizationId).IsRequired();
    }
}
