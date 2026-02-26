namespace Stretto.Application.DTOs;

public record ProjectDto(Guid Id, string Name, Guid ProgramYearId, DateOnly StartDate, DateOnly EndDate);

public record CreateProjectRequest(Guid ProgramYearId, string Name, DateOnly StartDate, DateOnly EndDate);

public record UpdateProjectRequest(string Name, DateOnly StartDate, DateOnly EndDate);
