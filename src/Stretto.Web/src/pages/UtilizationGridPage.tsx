import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell';
import { ProgramYearsService } from '../api/generated/services/ProgramYearsService';

type ProgramYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type ProjectDto = {
  id: string;
  name: string;
};

type UtilizationRow = {
  memberId: string;
  fullName: string;
  assignedCount: number;
  totalProjects: number;
  assignedProjectIds: string[];
};

type UtilizationGrid = {
  projects: ProjectDto[];
  members: UtilizationRow[];
};

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export default function UtilizationGridPage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  const { data: programYears = [], isLoading: yearsLoading } = useQuery<ProgramYear[]>({
    queryKey: ['programYears'],
    queryFn: () => ProgramYearsService.getApiProgramYears(),
  });

  const { data: grid, isLoading: gridLoading } = useQuery<UtilizationGrid>({
    queryKey: ['utilization', selectedYearId],
    queryFn: () => ProgramYearsService.getApiProgramYearsUtilization(selectedYearId),
    enabled: !!selectedYearId,
  });

  const isLoading = yearsLoading || (!!selectedYearId && gridLoading);

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Utilization</h1>

        <div className="mb-6">
          <select
            data-testid="program-year-select"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a program year…</option>
            {programYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}{y.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : !selectedYearId ? (
          <p className="text-muted-foreground">Select a program year to view utilization.</p>
        ) : !grid || grid.members.length === 0 ? (
          <p className="text-muted-foreground">No utilization data available for this program year.</p>
        ) : (
          <>
            {/* Desktop layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Member</th>
                    <th className="pb-2 pr-4 font-medium">Utilization</th>
                    {grid.projects.map((p) => (
                      <th
                        key={p.id}
                        title={p.name}
                        className="pb-2 pr-2 font-medium max-w-[100px]"
                      >
                        {truncate(p.name, 20)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.members.map((m) => (
                    <tr key={m.memberId} className="border-b">
                      <td className="py-2 pr-4 whitespace-nowrap">{m.fullName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.assignedCount}/{m.totalProjects}
                      </td>
                      {grid.projects.map((p) => (
                        <td key={p.id} className="py-2 pr-2">
                          <div
                            className={`w-6 h-6 rounded ${
                              m.assignedProjectIds.includes(p.id)
                                ? 'bg-indigo-600'
                                : 'bg-muted'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile layout */}
            <div className="block md:hidden space-y-3">
              {grid.members.map((m) => {
                const assignedNames = grid.projects
                  .filter((p) => m.assignedProjectIds.includes(p.id))
                  .map((p) => p.name)
                  .join(', ');
                return (
                  <div key={m.memberId} className="rounded-lg border p-3">
                    <p className="font-medium">{m.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.assignedCount}/{m.totalProjects} projects
                    </p>
                    {assignedNames && (
                      <p className="text-sm mt-1">{assignedNames}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
