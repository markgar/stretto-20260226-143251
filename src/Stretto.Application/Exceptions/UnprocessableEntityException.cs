namespace Stretto.Application.Exceptions;

public class UnprocessableEntityException : Exception
{
<<<<<<< HEAD
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
=======
    public UnprocessableEntityException(string message) : base(message) { }
>>>>>>> 635556b ([validator] Add audition controllers, UnprocessableEntityException (422), and milestone 11a validation)
}
