import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectsService } from '../api/generated/services/ProjectsService';

type ProjectMember = {
  memberId: string;
  fullName: string;
  email: string;
  isAssigned: boolean;
};

type Props = { projectId: string };

export default function ProjectMembersTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery<ProjectMember[]>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => ProjectsService.getApiProjectsMembers(projectId),
  });

  const assignMutation = useMutation({
    mutationFn: (memberId: string) =>
      ProjectsService.postApiProjectsMembers(projectId, { memberId }),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
    onError: () => setMutationError('Failed to assign member. Please try again.'),
  });

  const unassignMutation = useMutation({
    mutationFn: (memberId: string) =>
      ProjectsService.deleteApiProjectsMembers(projectId, memberId),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
    onError: () => setMutationError('Failed to unassign member. Please try again.'),
  });

  const isPending = assignMutation.isPending || unassignMutation.isPending;

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <input
        data-testid="member-search-input"
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {mutationError && (
        <p className="mb-4 text-sm text-destructive">{mutationError}</p>
      )}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No members found</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.memberId} className="border-b">
                <td className="py-2 pr-4">{m.fullName}</td>
                <td className="py-2 pr-4">{m.email}</td>
                <td className="py-2">
                  {m.isAssigned ? (
                    <button
                      data-testid={`unassign-${m.memberId}`}
                      disabled={isPending}
                      onClick={() => unassignMutation.mutate(m.memberId)}
                      className="rounded-md border px-3 py-1 text-sm text-destructive hover:bg-accent disabled:opacity-50"
                    >
                      Unassign
                    </button>
                  ) : (
                    <button
                      data-testid={`assign-${m.memberId}`}
                      disabled={isPending}
                      onClick={() => assignMutation.mutate(m.memberId)}
                      className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
