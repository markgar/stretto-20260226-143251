import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import AppShell from '../components/AppShell';
import EventTypeBadge from '../components/EventTypeBadge';
import { EventsService } from '../api/generated/services/EventsService';
import { AttendanceService } from '../api/generated/services/AttendanceService';
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

type AttendanceSummaryItem = {
  memberId: string;
  memberName: string;
  status: string | null;
};

function AttendanceStatusBadge({ status }: { status: string | null }) {
  if (status === 'Present') return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Present</span>;
  if (status === 'Excused') return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">Excused</span>;
  if (status === 'Absent') return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">Absent</span>;
  return <span className="text-sm text-muted-foreground">—</span>;
}

function AttendanceRow({ item, eventId }: { item: AttendanceSummaryItem; eventId: string }) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = React.useState<string | null>(null);
  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      AttendanceService.putApiEventsAttendance(eventId, item.memberId, { status }),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ['attendance', eventId] });
    },
    onError: () => setMutationError('Failed to update status. Please try again.'),
  });

  return (
    <div className="flex flex-col py-2 border-b last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{item.memberName}</span>
          <AttendanceStatusBadge status={item.status} />
        </div>
        <select
          value={item.status ?? ''}
          onChange={(e) => statusMutation.mutate(e.target.value)}
          disabled={statusMutation.isPending}
          className="text-sm border rounded px-2 py-1 disabled:opacity-50"
          aria-label={`Set status for ${item.memberName}`}
        >
          <option value="">— Select —</option>
          <option value="Present">Present</option>
          <option value="Excused">Excused</option>
          <option value="Absent">Absent</option>
        </select>
      </div>
      {mutationError && <p className="text-xs text-destructive mt-1">{mutationError}</p>}
    </div>
  );
}

function AttendancePanel({ eventId }: { eventId: string }) {
  const { data: attendance, isLoading, isError } = useQuery<AttendanceSummaryItem[]>({
    queryKey: ['attendance', eventId],
    queryFn: () => AttendanceService.getApiEventsAttendance(eventId),
  });

  return (
    <section data-testid="attendance-panel" className="mt-8 rounded-lg border p-4 max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Attendance</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Check-in URL:{' '}
        <span data-testid="checkin-url" className="font-mono text-foreground">
          /checkin/{eventId}
        </span>
      </p>
      {isError && <p className="text-sm text-destructive">Failed to load attendance. Please refresh.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading attendance…</p>}
      {attendance && attendance.length === 0 && (
        <p className="text-sm text-muted-foreground">No members found.</p>
      )}
      {attendance && attendance.map((item) => (
        <AttendanceRow key={item.memberId} item={item} eventId={eventId} />
      ))}
    </section>
  );
}

function MemberAttendanceSection({ eventId, memberId }: { eventId: string; memberId: string }) {
  const queryClient = useQueryClient();
  const [toggleError, setToggleError] = React.useState<string | null>(null);

  const { data: myRecord, isError: isRecordError } = useQuery<AttendanceSummaryItem | null>({
    queryKey: ['my-attendance', eventId],
    queryFn: () => AttendanceService.getApiEventsAttendanceMe(eventId),
  });

  const isExcused = myRecord?.status === 'Excused';

  const toggleMutation = useMutation({
    mutationFn: () => AttendanceService.putApiEventsAttendanceMeExcused(eventId),
    onSuccess: () => {
      setToggleError(null);
      queryClient.invalidateQueries({ queryKey: ['my-attendance', eventId] });
    },
    onError: () => setToggleError('Failed to update. Please try again.'),
  });

  return (
    <section className="mt-8 rounded-lg border p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-3">My Attendance</h2>
      {isRecordError && <p className="text-sm text-destructive mb-2">Failed to load attendance status.</p>}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium">Status</span>
        <AttendanceStatusBadge status={myRecord?.status ?? null} />
      </div>
      <button
        data-testid="excuse-toggle"
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
      >
        {isExcused ? 'Remove excuse' : 'Excuse my absence'}
      </button>
      {toggleError && <p className="text-sm text-destructive mt-2">{toggleError}</p>}
    </section>
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
            {deleteMutation.isError && (
              <p className="text-destructive text-sm mb-4">Failed to delete. Please try again.</p>
            )}
            <div className="rounded-lg border p-4 max-w-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Type</span>
                <EventTypeBadge type={event.type} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Date</span>
                <span className="text-sm">{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</span>
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
            {isAdmin && <AttendancePanel eventId={id!} />}
            {user?.role === 'Member' && <MemberAttendanceSection eventId={id!} memberId={user.id} />}
          </>
        )}
      </div>
    </AppShell>
  );
}
