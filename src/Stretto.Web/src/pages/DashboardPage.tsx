import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import AppShell from '../components/AppShell';
import { useDashboard } from './useDashboard';
import { useProgramYearsList } from './useProgramYearsList';

export default function DashboardPage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const { programYears } = useProgramYearsList();
  const { summary, isLoading } = useDashboard(selectedYearId);

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 data-testid="dashboard-heading" className="text-2xl font-semibold">
          Dashboard
        </h1>

        <div>
          <select
            data-testid="program-year-select"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Current Year</option>
            {programYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div data-testid="dashboard-skeleton" className="space-y-4">
            <div className="h-12 rounded-md bg-muted animate-pulse" />
            <div className="h-12 rounded-md bg-muted animate-pulse" />
            <div className="h-12 rounded-md bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-medium mb-2">Upcoming Events (Next 30 Days)</h2>
              {!summary?.upcomingEvents || summary.upcomingEvents.length === 0 ? (
                <p data-testid="no-upcoming-events" className="text-muted-foreground text-sm">
                  No events scheduled in the next 30 days.
                </p>
              ) : (
                <ul className="space-y-2">
                  {summary.upcomingEvents.map((event) => (
                    <li data-testid="upcoming-event-row" key={event.id} className="flex items-center gap-4 text-sm">
                      <span>{format(parseISO(event.date), 'MMM d, yyyy')}</span>
                      <span className="font-medium">{event.projectName}</span>
                      <span className="text-muted-foreground">{event.venueName ?? 'No venue'}</span>
                      <span
                        data-testid="event-type-badge"
                        className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
                      >
                        {event.eventType}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-lg font-medium mb-2">Recent Activity</h2>
              {!summary?.recentActivity || summary.recentActivity.length === 0 ? (
                <p data-testid="no-recent-activity" className="text-muted-foreground text-sm">
                  No recent activity.
                </p>
              ) : (
                <ul className="space-y-2">
                  {summary.recentActivity.map((item, idx) => (
                    <li data-testid="activity-item" key={idx} className="flex items-center gap-4 text-sm">
                      <span>{item.description}</span>
                      <span className="text-muted-foreground">
                        {format(parseISO(item.occurredAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

