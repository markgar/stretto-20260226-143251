## Milestone: Admin Dashboard – Frontend

> **Validates:**
> - Navigate to `/dashboard` as an admin; the page renders with heading `data-testid="dashboard-heading"` and a program year selector `data-testid="program-year-select"`
> - While the dashboard data is loading, skeleton loaders are visible (`data-testid="dashboard-skeleton"`)
> - When a program year with upcoming events exists, the upcoming events list renders rows with `data-testid="upcoming-event-row"` each containing date, project name, venue name, and event type
> - When no events are scheduled, the empty-state element `data-testid="no-upcoming-events"` is visible
> - Recent activity feed items are visible with `data-testid="activity-item"` when new members or assignments exist
> - When no recent activity exists, the empty-state element `data-testid="no-recent-activity"` is visible

> **Reference files:**
> - `src/Stretto.Web/src/pages/UtilizationGridPage.tsx` — program year selector pattern with `useQuery`, skeleton loading state, and empty state handling
> - `src/Stretto.Web/src/pages/useProgramYearsList.ts` — custom hook extracting query logic; follow this pattern for `useDashboard.ts`
> - `src/Stretto.Web/src/pages/ProgramYearsListPage.tsx` — list rendering with status badges and Tailwind layout
> - `src/Stretto.Web/src/App.tsx` — no route change needed; `/dashboard` already routes to `DashboardPage`
> - `src/Stretto.Web/src/api/generated/services/` — run `npm run generate` to regenerate after the backend milestone adds `DashboardService`

- [x] Regenerate the TypeScript API client by running `npm run generate` in `src/Stretto.Web/` (requires the backend to be running at `http://localhost:5000`); if the backend is not running, manually create `src/Stretto.Web/src/api/generated/services/DashboardService.ts` with one method `getApiDashboardSummary(programYearId?: string): CancelablePromise<DashboardSummaryDto>` calling `GET /api/dashboard/summary` with optional `programYearId` query param; create `src/Stretto.Web/src/api/generated/models/DashboardSummaryDto.ts` with `{ programYearId: string | null; programYearName: string | null; upcomingEvents: UpcomingEventDto[]; recentActivity: RecentActivityItem[] }`; create `src/Stretto.Web/src/api/generated/models/UpcomingEventDto.ts` with `{ id: string; projectId: string; projectName: string; eventType: string; date: string; startTime: string; durationMinutes: number; venueName: string | null }`; create `src/Stretto.Web/src/api/generated/models/RecentActivityItem.ts` with `{ activityType: string; description: string; occurredAt: string }`; export the new models from `src/Stretto.Web/src/api/generated/models/index.ts` and export `DashboardService` from `src/Stretto.Web/src/api/generated/services/index.ts`

- [ ] Create `src/Stretto.Web/src/pages/useDashboard.ts` — custom hook that accepts `selectedYearId: string` and returns `{ summary, isLoading }`; use `useQuery<DashboardSummaryDto>` with `queryKey: ['dashboard', selectedYearId]` and `queryFn: () => DashboardService.getApiDashboardSummary(selectedYearId || undefined)`; always enabled (fetches current year when `selectedYearId` is empty string); import `DashboardSummaryDto` from the generated models

- [ ] Replace `src/Stretto.Web/src/pages/DashboardPage.tsx` with the full admin dashboard page; import `useDashboard`, `useProgramYearsList` hooks, `format` and `parseISO` from `date-fns`; render `AppShell` wrapping a `div.p-6.space-y-6`; include heading `data-testid="dashboard-heading"` with text "Dashboard"; render a `<select data-testid="program-year-select">` populated from `useProgramYearsList()` with a leading option "Current Year" (value `""`) followed by each program year by name and id; store selected year id in local `useState<string>('')`

- [ ] Add skeleton loader to `DashboardPage.tsx`: when `isLoading` is true, render `<div data-testid="dashboard-skeleton" className="space-y-4">` containing three `<div className="h-12 rounded-md bg-muted animate-pulse" />` placeholder blocks instead of the data sections

- [ ] Add the upcoming events section to `DashboardPage.tsx`: when not loading, render a `<section>` with heading "Upcoming Events (Next 30 Days)"; when `summary?.upcomingEvents` is empty or undefined, render `<p data-testid="no-upcoming-events" className="text-muted-foreground text-sm">No events scheduled in the next 30 days.</p>`; otherwise render a `<ul>` where each event is an `<li data-testid="upcoming-event-row" key={event.id}>` showing `format(parseISO(event.date), 'MMM d, yyyy')`, `event.projectName`, `event.venueName ?? 'No venue'`, and `event.eventType` as a small badge with `data-testid="event-type-badge"`

- [ ] Add the recent activity feed section to `DashboardPage.tsx`: render a `<section>` with heading "Recent Activity"; when `summary?.recentActivity` is empty or undefined, render `<p data-testid="no-recent-activity" className="text-muted-foreground text-sm">No recent activity.</p>`; otherwise render a `<ul>` where each item is an `<li data-testid="activity-item" key={idx}>` showing `item.description` and `format(parseISO(item.occurredAt), 'MMM d, yyyy h:mm a')`
