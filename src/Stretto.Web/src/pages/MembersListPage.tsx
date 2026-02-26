import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function MembersListPage() {
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['members', search],
    queryFn: () =>
      fetch(
        `/api/members${search ? `?search=${encodeURIComponent(search)}` : ''}`,
        { credentials: 'include' }
      ).then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      }),
  });

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 data-testid="members-heading" className="text-2xl font-semibold">
            Members
          </h1>
          <Link
            to="/members/new"
            data-testid="add-member-button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Member
          </Link>
        </div>
        <div className="mb-4">
          <input
            type="search"
            data-testid="search-input"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2 pr-4">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="py-2 pr-4">{m.email}</td>
                  <td className="py-2 pr-4">{m.role}</td>
                  <td className="py-2 pr-4">
                    <span
                      data-testid={`status-badge-${m.id}`}
                      className={m.isActive ? 'text-green-600' : 'text-muted-foreground'}
                    >
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <Link
                      to={`/members/${m.id}`}
                      data-testid={`view-${m.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      to={`/members/${m.id}/edit`}
                      data-testid={`edit-${m.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
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
