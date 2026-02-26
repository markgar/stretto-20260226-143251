namespace Stretto.Application.Interfaces;

public interface INotificationProvider
{
    Task SendAsync(string to, string subject, string body);
}
