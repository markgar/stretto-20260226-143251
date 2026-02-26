## Milestone: Domain Entities + Application Interfaces

> **Validates:**
> - `dotnet build Stretto.sln` exits 0 from the repository root
> - `dotnet test Stretto.sln` exits 0 and all tests pass

> **Reference files:**
> - `src/Stretto.Infrastructure/Stretto.Infrastructure.csproj` — project reference and NuGet package pattern for adding EF Core packages

- [x] Create `NotFoundException` (constructor: `string message`) and `ValidationException` (constructor: `IDictionary<string, string[]> errors`) in `Stretto.Application/Exceptions/`; both inherit from `Exception`
- [x] Create `Organization` entity (Id Guid, Name string, CreatedAt DateTime) in `Stretto.Domain/Entities/Organization.cs`
- [x] Create `Role` enum `{Admin = 0, Member = 1}` in `Stretto.Domain/Enums/Role.cs`; create `Member` entity (Id Guid, FirstName string, LastName string, Email string, Role Role, IsActive bool, OrganizationId Guid) in `Stretto.Domain/Entities/Member.cs`
- [x] Create `ProgramYear` entity (Id Guid, Name string, StartDate DateOnly, EndDate DateOnly, IsCurrent bool, IsArchived bool, OrganizationId Guid) in `Stretto.Domain/Entities/ProgramYear.cs`
- [x] Create `Venue` entity (Id Guid, Name string, Address string, ContactName string?, ContactEmail string?, ContactPhone string?, OrganizationId Guid) in `Stretto.Domain/Entities/Venue.cs`
- [x] Create `Project` entity (Id Guid, Name string, ProgramYearId Guid, StartDate DateOnly, EndDate DateOnly, OrganizationId Guid) in `Stretto.Domain/Entities/Project.cs`
- [x] Create `EventType` enum `{Rehearsal = 0, Performance = 1}` in `Stretto.Domain/Enums/EventType.cs`; create `Event` entity (Id Guid, ProjectId Guid, EventType EventType, Date DateOnly, StartTime TimeOnly, DurationMinutes int, VenueId Guid?, OrganizationId Guid) in `Stretto.Domain/Entities/Event.cs`
- [x] Create `ProjectAssignment` entity (Id Guid, ProjectId Guid, MemberId Guid, OrganizationId Guid) in `Stretto.Domain/Entities/ProjectAssignment.cs`
- [x] Create `AttendanceStatus` enum `{Present = 0, Excused = 1, Absent = 2}` in `Stretto.Domain/Enums/AttendanceStatus.cs`; create `AttendanceRecord` entity (Id Guid, EventId Guid, MemberId Guid, Status AttendanceStatus, OrganizationId Guid) in `Stretto.Domain/Entities/AttendanceRecord.cs`
- [x] Create `AuditionDate` entity (Id Guid, ProgramYearId Guid, StartTime TimeOnly, EndTime TimeOnly, BlockLengthMinutes int, OrganizationId Guid) in `Stretto.Domain/Entities/AuditionDate.cs`
- [x] Create `AuditionStatus` enum `{Pending = 0, Accepted = 1, Rejected = 2, Waitlisted = 3}` in `Stretto.Domain/Enums/AuditionStatus.cs`; create `AuditionSlot` entity (Id Guid, AuditionDateId Guid, SlotTime TimeOnly, MemberId Guid?, Status AuditionStatus, Notes string?, OrganizationId Guid) in `Stretto.Domain/Entities/AuditionSlot.cs`
- [ ] Create `ProjectLink` entity (Id Guid, ProjectId Guid, Title string, Url string, OrganizationId Guid) in `Stretto.Domain/Entities/ProjectLink.cs`
- [ ] Create `ProjectDocument` entity (Id Guid, ProjectId Guid, Title string, FileName string, StoragePath string, OrganizationId Guid) in `Stretto.Domain/Entities/ProjectDocument.cs`
- [ ] Create `IRepository<T>` interface in `Stretto.Application/Interfaces/IRepository.cs` with methods: `Task<T?> GetByIdAsync(Guid id, Guid orgId)`, `Task<List<T>> ListAsync(Guid orgId, Expression<Func<T, bool>>? predicate = null)`, `Task AddAsync(T entity)`, `Task UpdateAsync(T entity)`, `Task DeleteAsync(T entity)`
- [ ] Create `IStorageProvider` interface in `Stretto.Application/Interfaces/IStorageProvider.cs` with methods: `Task<string> SaveAsync(string fileName, Stream content)`, `Task<Stream> GetAsync(string storagePath)`, `Task DeleteAsync(string storagePath)`
- [ ] Create `INotificationProvider` interface in `Stretto.Application/Interfaces/INotificationProvider.cs` with method: `Task SendAsync(string to, string subject, string body)`
