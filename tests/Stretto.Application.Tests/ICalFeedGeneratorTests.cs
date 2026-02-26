using Stretto.Application;
using Stretto.Application.DTOs;

namespace Stretto.Application.Tests;

/// <summary>
/// Unit tests for ICalFeedGenerator — verifies RFC 5545 iCal output structure and content.
/// </summary>
public class ICalFeedGeneratorTests
{
    private static CalendarEventDto MakeEvent(
        string projectName = "Spring Concert",
        string eventType = "Rehearsal",
        DateOnly? date = null,
        TimeOnly? startTime = null,
        int durationMinutes = 120,
        string? venueName = null) => new(
            Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"),
            Guid.NewGuid(),
            projectName,
            eventType,
            date ?? new DateOnly(2025, 10, 15),
            startTime ?? new TimeOnly(18, 30),
            durationMinutes,
            venueName);

    [Fact]
    public void Generate_empty_events_produces_valid_vcalendar_wrapper()
    {
        var result = ICalFeedGenerator.Generate([], "Test Calendar");

        Assert.Contains("BEGIN:VCALENDAR", result);
        Assert.Contains("END:VCALENDAR", result);
        Assert.Contains("VERSION:2.0", result);
        Assert.Contains("PRODID:-//Stretto//Stretto//EN", result);
    }

    [Fact]
    public void Generate_includes_calendar_name_in_x_wr_calname()
    {
        var result = ICalFeedGenerator.Generate([], "My Stretto Calendar");

        Assert.Contains("X-WR-CALNAME:My Stretto Calendar", result);
    }

    [Fact]
    public void Generate_produces_one_vevent_per_event()
    {
        var events = new[]
        {
            MakeEvent(date: new DateOnly(2025, 10, 15)),
            MakeEvent(date: new DateOnly(2025, 10, 22)),
            MakeEvent(date: new DateOnly(2025, 10, 29))
        };

        var result = ICalFeedGenerator.Generate(events, "Cal");

        Assert.Equal(3, CountOccurrences(result, "BEGIN:VEVENT"));
        Assert.Equal(3, CountOccurrences(result, "END:VEVENT"));
    }

    [Fact]
    public void Generate_event_uid_contains_event_id_at_stretto()
    {
        var ev = MakeEvent();
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        Assert.Contains($"UID:{ev.EventId}@stretto", result);
    }

    [Fact]
    public void Generate_dtstart_uses_date_only_format()
    {
        var ev = MakeEvent(date: new DateOnly(2025, 10, 15));
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        Assert.Contains("DTSTART;VALUE=DATE:20251015", result);
    }

    [Fact]
    public void Generate_dtend_is_computed_from_start_time_plus_duration()
    {
        var ev = MakeEvent(startTime: new TimeOnly(18, 30), durationMinutes: 120);
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        // 18:30 + 120 minutes = 20:30
        Assert.Contains("DTEND:20251015T203000", result);
    }

    [Fact]
    public void Generate_dtend_crosses_midnight_correctly()
    {
        var ev = MakeEvent(date: new DateOnly(2025, 10, 15), startTime: new TimeOnly(23, 0), durationMinutes: 120);
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        // 23:00 + 120 minutes = 01:00 next day
        Assert.Contains("DTEND:20251016T010000", result);
    }

    [Fact]
    public void Generate_summary_includes_project_name_and_event_type()
    {
        var ev = MakeEvent(projectName: "Spring Concert", eventType: "Performance");
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        Assert.Contains("SUMMARY:Spring Concert", result);
        Assert.Contains("Performance", result);
    }

    [Fact]
    public void Generate_uses_crlf_line_endings()
    {
        var result = ICalFeedGenerator.Generate([], "Cal");

        Assert.Contains("\r\n", result);
        // Should not have bare LF without CR
        var withoutCrlf = result.Replace("\r\n", "");
        Assert.DoesNotContain("\n", withoutCrlf);
    }

    [Fact]
    public void Generate_folds_lines_longer_than_75_chars()
    {
        var longName = new string('A', 80);
        var ev = MakeEvent(projectName: longName);
        var result = ICalFeedGenerator.Generate([ev], "Cal");

        foreach (var line in result.Split("\r\n", StringSplitOptions.RemoveEmptyEntries))
        {
            Assert.True(line.Length <= 75, $"Line exceeds 75 chars: '{line}'");
        }
    }

    private static int CountOccurrences(string text, string pattern) =>
        (text.Length - text.Replace(pattern, "").Length) / pattern.Length;
}
