using Microsoft.Extensions.Logging.Abstractions;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure.Tests;

/// <summary>
/// Tests for LogNotificationProvider — verifies it implements INotificationProvider
/// and completes successfully without throwing.
/// </summary>
public class LogNotificationProviderTests
{
    [Fact]
    public void LogNotificationProvider_implements_INotificationProvider()
    {
        var provider = new LogNotificationProvider(NullLogger<LogNotificationProvider>.Instance);
        Assert.IsAssignableFrom<INotificationProvider>(provider);
    }

    [Fact]
    public async Task SendAsync_completes_without_throwing()
    {
        var provider = new LogNotificationProvider(NullLogger<LogNotificationProvider>.Instance);

        await provider.SendAsync("member@example.com", "Hello Choir", "Rehearsal is this Friday at 7pm.");
    }

    [Fact]
    public async Task SendAsync_returns_completed_task()
    {
        var provider = new LogNotificationProvider(NullLogger<LogNotificationProvider>.Instance);

        var task = provider.SendAsync("member@example.com", "Subject", "Body");
        await task;

        Assert.True(task.IsCompleted);
    }
}
