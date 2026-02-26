namespace Stretto.Application.Interfaces;

public interface IAuthSessionStore
{
    string CreateSession(Guid memberId);
    Guid? GetMemberId(string token);
    void DeleteSession(string token);
}
