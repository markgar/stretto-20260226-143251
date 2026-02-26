namespace Stretto.Application.DTOs;

public record ProgramYearDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsArchived);

public record CreateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate);

public record UpdateProgramYearRequest(string Name, DateOnly StartDate, DateOnly EndDate);
