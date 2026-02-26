using System.Text;
using Stretto.Application.DTOs;

namespace Stretto.Application;

public static class ICalFeedGenerator
{
    private const string Crlf = "\r\n";

    public static string Generate(IEnumerable<CalendarEventDto> events, string calendarName)
    {
        var sb = new StringBuilder();
        AppendLine(sb, "BEGIN:VCALENDAR");
        AppendLine(sb, "VERSION:2.0");
        AppendLine(sb, "PRODID:-//Stretto//Stretto//EN");
        AppendFolded(sb, $"X-WR-CALNAME:{calendarName}");

        foreach (var ev in events)
        {
            var endDateTime = ev.Date.ToDateTime(ev.StartTime).AddMinutes(ev.DurationMinutes);
            var endDate = DateOnly.FromDateTime(endDateTime);
            var endTime = TimeOnly.FromDateTime(endDateTime);

            AppendLine(sb, "BEGIN:VEVENT");
            AppendFolded(sb, $"UID:{ev.EventId}@stretto");
            AppendLine(sb, $"DTSTART;VALUE=DATE:{ev.Date:yyyyMMdd}");
            AppendLine(sb, $"DTEND:{endDate:yyyyMMdd}T{endTime:HHmmss}");
            AppendFolded(sb, $"SUMMARY:{ev.ProjectName} \u2013 {ev.EventType}");
            AppendLine(sb, "END:VEVENT");
        }

        AppendLine(sb, "END:VCALENDAR");
        return sb.ToString();
    }

    private static void AppendLine(StringBuilder sb, string line)
    {
        sb.Append(line);
        sb.Append(Crlf);
    }

    private static void AppendFolded(StringBuilder sb, string line)
    {
        const int maxLength = 75;
        if (line.Length <= maxLength)
        {
            AppendLine(sb, line);
            return;
        }

        AppendLine(sb, line[..maxLength]);
        var remaining = line[maxLength..];
        while (remaining.Length > 0)
        {
            var take = Math.Min(74, remaining.Length);
            AppendLine(sb, " " + remaining[..take]);
            remaining = remaining[take..];
        }
    }
}
