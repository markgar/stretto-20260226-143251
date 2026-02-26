namespace Stretto.Application.Exceptions;

public class UnprocessableEntityException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public UnprocessableEntityException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public UnprocessableEntityException(Dictionary<string, string[]> errors)
        : base("Validation failed")
    {
        Errors = errors;
    }
}
