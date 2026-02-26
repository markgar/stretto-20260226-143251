using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class ProjectAssignmentConfiguration : IEntityTypeConfiguration<ProjectAssignment>
{
    public void Configure(EntityTypeBuilder<ProjectAssignment> builder)
    {
        builder.HasKey(pa => pa.Id);
        builder.Property(pa => pa.ProjectId).IsRequired();
        builder.Property(pa => pa.MemberId).IsRequired();
        builder.Property(pa => pa.CreatedAt).IsRequired();
        builder.Property(pa => pa.OrganizationId).IsRequired();
        builder.HasIndex(pa => new { pa.OrganizationId, pa.ProjectId, pa.MemberId }).IsUnique();
    }
}
