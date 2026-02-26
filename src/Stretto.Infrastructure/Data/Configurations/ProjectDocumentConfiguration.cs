using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data.Configurations;

public class ProjectDocumentConfiguration : IEntityTypeConfiguration<ProjectDocument>
{
    public void Configure(EntityTypeBuilder<ProjectDocument> builder)
    {
        builder.HasKey(pd => pd.Id);
        builder.Property(pd => pd.ProjectId).IsRequired();
        builder.Property(pd => pd.Title).IsRequired().HasMaxLength(255);
        builder.Property(pd => pd.FileName).IsRequired().HasMaxLength(255);
        builder.Property(pd => pd.StoragePath).IsRequired().HasMaxLength(1024);
        builder.Property(pd => pd.OrganizationId).IsRequired();
    }
}
