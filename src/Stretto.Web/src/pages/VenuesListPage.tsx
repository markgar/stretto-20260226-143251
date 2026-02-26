import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';

type Venue = {
  id: string;
  name: string;
  address: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export default function VenuesListPage() {
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: () => fetch('/api/venues', { credentials: 'include' }).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/venues/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues'] }),
  });

  function contactSummary(v: Venue) {
    return [v.contactName, v.contactEmail, v.contactPhone].filter(Boolean).join(' / ');
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 data-testid="venues-heading" className="text-2xl font-semibold">
            Venues
          </h1>
          <Link
            to="/venues/new"
            data-testid="add-venue-button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Venue
          </Link>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Address</th>
                <th className="pb-2 pr-4">Contact</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="py-2 pr-4">{v.name}</td>
                  <td className="py-2 pr-4">{v.address}</td>
                  <td className="py-2 pr-4">{contactSummary(v)}</td>
                  <td className="py-2 flex gap-2">
                    <Link
                      to={`/venues/${v.id}/edit`}
                      data-testid={`edit-venue-${v.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      data-testid={`delete-venue-${v.id}`}
                      onClick={() => deleteMutation.mutate(v.id)}
                      className="text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
