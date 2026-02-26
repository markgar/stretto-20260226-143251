import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import AppShell from '../components/AppShell';
import { useProgramYearsList } from './useProgramYearsList';

export default function ProgramYearsListPage() {
  const { programYears, archiveMutation, activateMutation } = useProgramYearsList();

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 data-testid="program-years-heading" className="text-2xl font-semibold">
            Program Years
          </h1>
          <Link
            to="/program-years/new"
            data-testid="add-program-year-button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Program Year
          </Link>
        </div>

        <ul className="space-y-2">
          {programYears.map((py) => (
            <li key={py.id} className="flex items-center gap-4 rounded-md border p-4">
              <div className="flex-1">
                <p className="font-medium">{py.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(py.startDate), 'MMM d, yyyy')} –{' '}
                  {format(parseISO(py.endDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {py.isCurrent && (
                  <span data-testid={`current-badge-${py.id}`} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Current
                  </span>
                )}
                {py.isArchived && (
                  <span data-testid={`archived-badge-${py.id}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Archived
                  </span>
                )}
                <Link to={`/program-years/${py.id}`} data-testid={`view-${py.id}`} className="text-sm text-primary hover:underline">View</Link>
                {!py.isArchived && (
                  <button data-testid={`archive-${py.id}`} onClick={() => archiveMutation.mutate(py.id)} className="text-sm text-muted-foreground hover:text-foreground">
                    Archive
                  </button>
                )}
                {!py.isCurrent && !py.isArchived && (
                  <button data-testid={`activate-${py.id}`} onClick={() => activateMutation.mutate(py.id)} className="text-sm text-muted-foreground hover:text-foreground">
                    Activate
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
