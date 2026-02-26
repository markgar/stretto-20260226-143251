import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import AppShell from '../components/AppShell';
import { EventsService } from '../api/generated/services/EventsService';
import { useAuthStore } from '../stores/authStore';

type Event = {
  id: string;
  type: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  venueName?: string;
  projectId: string;
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

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const { data: event, isLoading, isError } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => EventsService.getApiEvents1(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => EventsService.deleteApiEvents(id!),
    onSuccess: () => {
      const dest = event?.projectId ? `/projects/${event.projectId}` : '/projects';
      navigate(dest);
    },
  });

  return (
    <AppShell>
      <div className="p-6">
        {isLoading && (
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        )}
        {isError && (
          <p className="text-destructive">Failed to load event. Please try again.</p>
        )}
        {event && (
          <>
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-2xl font-semibold">Event Detail</h1>
              {isAdmin && (
                <div className="flex gap-2">
                  <Link
                    to={`/events/${id}/edit`}
                    data-testid="edit-event-button"
                    className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                  >
                    Edit
                  </Link>
                  <button
                    data-testid="delete-event-button"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="rounded-md border px-4 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="rounded-lg border p-4 max-w-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Type</span>
                <EventTypeBadge type={event.type} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Date</span>
                <span className="text-sm">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Start Time</span>
                <span className="text-sm">{event.startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Duration</span>
                <span className="text-sm">{event.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Venue</span>
                <span className="text-sm">{event.venueName ?? 'No venue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Project</span>
                <Link to={`/projects/${event.projectId}`} className="text-sm text-primary hover:underline">
                  View project
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
