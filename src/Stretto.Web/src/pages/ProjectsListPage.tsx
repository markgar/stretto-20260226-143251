import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import AppShell from '../components/AppShell';
import { ProjectsService } from '../api/generated/services/ProjectsService';
import { useAuthStore } from '../stores/authStore';

type Project = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export default function ProjectsListPage() {
  const [searchParams] = useSearchParams();
  const programYearId = searchParams.get('programYearId') ?? undefined;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects', programYearId],
    queryFn: () => ProjectsService.getApiProjects(programYearId),
  });

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 data-testid="projects-heading" className="text-2xl font-semibold">Projects</h1>
          {isAdmin && (
            <Link
              to={`/projects/new${programYearId ? `?programYearId=${programYearId}` : ''}`}
              data-testid="add-project-button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add project
            </Link>
          )}
        </div>
        {isError && (
          <p className="text-destructive mb-4">Failed to load projects. Please try again.</p>
        )}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground">No projects yet — create your first project</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Start Date</th>
                <th className="pb-2">End Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 pr-4">
                    <Link to={`/projects/${p.id}`} className="text-primary hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{format(new Date(p.startDate), 'MMM d, yyyy')}</td>
                  <td className="py-2">{format(new Date(p.endDate), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
