using Microsoft.EntityFrameworkCore;
using Stretto.Domain.Entities;

namespace Stretto.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<ProgramYear> ProgramYears => Set<ProgramYear>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<ProjectAssignment> ProjectAssignments => Set<ProjectAssignment>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AuditionDate> AuditionDates => Set<AuditionDate>();
    public DbSet<AuditionSlot> AuditionSlots => Set<AuditionSlot>();
    public DbSet<ProjectLink> ProjectLinks => Set<ProjectLink>();
    public DbSet<ProjectDocument> ProjectDocuments => Set<ProjectDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
