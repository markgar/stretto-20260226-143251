using Microsoft.Extensions.Logging;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure;

public class LogNotificationProvider : INotificationProvider
{
    private readonly ILogger<LogNotificationProvider> _logger;

    public LogNotificationProvider(ILogger<LogNotificationProvider> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string body)
    {
        _logger.LogInformation("[NOTIFICATION] To: {to} | Subject: {subject} | Body: {body}", to, subject, body);
        return Task.CompletedTask;
    }
}
