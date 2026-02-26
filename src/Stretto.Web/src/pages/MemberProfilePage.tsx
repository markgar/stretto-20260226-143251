import { useParams } from 'react-router-dom';
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

type Assignment = {
  projectId: string;
  projectName: string;
};

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: member } = useQuery<Member>({
    queryKey: ['member', id],
    queryFn: () =>
      fetch(`/api/members/${id}`, { credentials: 'include' }).then((r) => r.json()),
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ['member-assignments', id],
    queryFn: () =>
      fetch(`/api/members/${id}/assignments`, { credentials: 'include' }).then((r) =>
        r.json()
      ),
  });

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 data-testid="member-name" className="text-2xl font-semibold">
            {member?.firstName} {member?.lastName}
          </h1>
          <Link
            to={`/members/${id}/edit`}
            data-testid="edit-link"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
        <div className="space-y-2 mb-6 text-sm">
          <p>{member?.email}</p>
          <p>{member?.role}</p>
          <span data-testid="status-badge" className="inline-block">
            {member?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <section>
          <h2 data-testid="assignments-heading" className="text-lg font-semibold mb-2">
            Projects
          </h2>
          {assignments.length === 0 ? (
            <p data-testid="no-assignments" className="text-muted-foreground text-sm">
              No projects assigned
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {assignments.map((a) => (
                <li key={a.projectId} data-testid={`assignment-${a.projectId}`}>
                  {a.projectName}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
