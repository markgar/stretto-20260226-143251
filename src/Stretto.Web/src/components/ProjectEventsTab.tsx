import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { EventsService } from '../api/generated/services/EventsService';
import { useAuthStore } from '../stores/authStore';

type Event = {
  id: string;
  date: string;
  startTime: string;
  type: number;
  venueName?: string;
  durationMinutes: number;
};

function EventTypeBadge({ type }: { type: number }) {
  if (type === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
        Rehearsal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
      Performance
    </span>
  );
}

type Props = { projectId: string };

export default function ProjectEventsTab({ projectId }: Props) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', projectId],
    queryFn: () => EventsService.getApiEvents(projectId),
  });

  return (
    <div>
      {isAdmin && (
        <div className="mb-4">
          <Link
            to={`/events/new?projectId=${projectId}`}
            data-testid="add-event-button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add event
          </Link>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No events scheduled yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Start Time</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Venue</th>
              <th className="pb-2">Duration (min)</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="py-2 pr-4">
                  <Link to={`/events/${e.id}`} className="text-primary hover:underline">
                    {format(new Date(e.date), 'MMM d, yyyy')}
                  </Link>
                </td>
                <td className="py-2 pr-4">{e.startTime}</td>
                <td className="py-2 pr-4"><EventTypeBadge type={e.type} /></td>
                <td className="py-2 pr-4">{e.venueName ?? '—'}</td>
                <td className="py-2">{e.durationMinutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
