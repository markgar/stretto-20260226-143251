import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import AppShell from '../components/AppShell';
import ProjectEventsTab from '../components/ProjectEventsTab';
import ProjectMembersTab from '../components/ProjectMembersTab';
import ProjectMaterialsTab from '../components/ProjectMaterialsTab';
import { ProjectsService } from '../api/generated/services/ProjectsService';
import { useAuthStore } from '../stores/authStore';

type Project = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  programYearId: string;
};

type TabId = 'overview' | 'events' | 'members' | 'materials';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
  { id: 'materials', label: 'Materials' },
];

import { useState } from 'react';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: project, isLoading, isError } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => ProjectsService.getApiProjects1(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ProjectsService.deleteApiProjects(id!),
    onSuccess: () => {
      const dest = project?.programYearId
        ? `/program-years/${project.programYearId}`
        : '/program-years';
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
          <p className="text-destructive">Failed to load project. Please try again.</p>
        )}
        {project && (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {format(parseISO(project.startDate), 'MMM d, yyyy')} –{' '}
                  {format(parseISO(project.endDate), 'MMM d, yyyy')}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${id}/edit`}
                    data-testid="edit-project-button"
                    className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                  >
                    Edit
                  </Link>
                  <button
                    data-testid="delete-project-button"
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

            <div className="border-b mb-4">
              <nav className="flex gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'overview' && (
              <div className="rounded-lg border p-4 max-w-md">
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(parseISO(project.startDate), 'MMM d, yyyy')} –{' '}
                  {format(parseISO(project.endDate), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            {activeTab === 'events' && <ProjectEventsTab projectId={id!} />}
            {activeTab === 'members' && <ProjectMembersTab projectId={id!} />}
            {activeTab === 'materials' && <ProjectMaterialsTab projectId={id!} />}
          </>
        )}
      </div>
    </AppShell>
  );
}
