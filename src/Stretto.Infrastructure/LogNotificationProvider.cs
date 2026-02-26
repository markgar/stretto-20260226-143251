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
        _logger.LogDebug("[NOTIFICATION] Subject: {subject}", subject);
        return Task.CompletedTask;
    }
}
