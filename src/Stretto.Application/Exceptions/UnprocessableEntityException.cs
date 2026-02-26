namespace Stretto.Application.Exceptions;

public class UnprocessableEntityException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public UnprocessableEntityException(Dictionary<string, string[]> errors)
        : base("Validation failed")
    {
        Errors = errors;
    }
}
