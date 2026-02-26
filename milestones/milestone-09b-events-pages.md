## Milestone: Events — Pages

> **Validates:**
> - Browser navigates to `/projects?programYearId={id}` and renders a list of projects
> - Browser navigates to `/projects/{id}` and renders a project detail page with an Events tab
> - Clicking the Events tab shows a table of events with type badges
> - Browser navigates to `/events/{id}` and renders the event detail page showing type, date, and duration

> **Reference files:**
> - `src/Stretto.Web/src/pages/VenuesListPage.tsx` — list page using `useQuery` and shadcn DataTable
> - `src/Stretto.Web/src/pages/VenueFormPage.tsx` — create/edit form using React Hook Form + Zod + `useMutation`
> - `src/Stretto.Web/src/App.tsx` — route registration; add project and event routes here
> - `src/Stretto.Web/src/api/generated/` — auto-generated TypeScript client (must be regenerated before starting this milestone)

- [x] Create `src/Stretto.Web/src/pages/ProjectsListPage.tsx`: reads `programYearId` from the URL query string; uses `useQuery` to call `ProjectsService.apiProjectsGet({ programYearId })`; renders a table with columns: project name (linked to `/projects/{id}`), start date, end date; includes an "Add project" button (visible to Admin role from auth store) that links to `/projects/new?programYearId={programYearId}`; shows a skeleton loader while loading; shows an empty state ("No projects yet — create your first project") when the list is empty; shows an inline error banner if the query fails

- [x] Create `src/Stretto.Web/src/pages/ProjectFormPage.tsx`: handles both create (path `/projects/new`, reads `programYearId` from query string) and edit (path `/projects/:id/edit`, fetches existing project with `useQuery`); Zod schema: `name` (non-empty string), `startDate` (required date string), `endDate` (required date string, must be after `startDate`); uses `useMutation` to call `ProjectsService.apiProjectsPost` for create or `ProjectsService.apiProjectsIdPut` for edit; on success navigates to `/projects/{id}` (create) or `/projects/{id}` (edit); cancel button navigates back

- [ ] Create `src/Stretto.Web/src/pages/ProjectDetailPage.tsx`: fetches the project by route param `id` using `useQuery` calling `ProjectsService.apiProjectsIdGet`; renders the project name as a page heading with start–end dates below; uses shadcn `<Tabs>` to render four tabs labelled Overview, Events, Members, Materials; Overview tab shows project name and date range in a card; Members tab and Materials tab render a "Coming soon" placeholder; Events tab renders `<ProjectEventsTab projectId={id} />` (imported from the component created in the next task); Admin-only header actions: "Edit" button linking to `/projects/{id}/edit` and "Delete" button that calls `ProjectsService.apiProjectsIdDelete` via `useMutation` then navigates to `/program-years/{programYearId}`

- [ ] Create `src/Stretto.Web/src/components/ProjectEventsTab.tsx` accepting prop `projectId: string`; uses `useQuery` calling `EventsService.apiEventsGet({ projectId })`; renders a table with columns: date (formatted `MMM d, yyyy` using date-fns `format`), start time, type badge (Rehearsal = indigo badge, Performance = purple badge using Tailwind classes), venue name (or "—" if none), duration in minutes; each row is linked to `/events/{id}`; Admin-only "Add event" button above the table links to `/events/new?projectId={projectId}`; shows a skeleton loader while loading; shows empty state ("No events scheduled yet") when list is empty

- [ ] Create `src/Stretto.Web/src/pages/EventFormPage.tsx`: handles create (path `/events/new`, reads `projectId` from query string) and edit (path `/events/:id/edit`, fetches existing event); Zod schema fields: `type` (enum `"0" | "1"` mapping to Rehearsal/Performance rendered as a select), `date` (required date string), `startTime` (required string in `HH:mm` format), `durationMinutes` (positive integer), `venueId` (optional UUID string); fetches venue list using `useQuery` to populate a select dropdown; uses `useMutation` to call `EventsService.apiEventsPost` (create) or `EventsService.apiEventsIdPut` (edit); on success navigates to `/events/{id}` (create) or `/events/{id}` (edit); cancel navigates back to `/projects/{projectId}`

- [ ] Create `src/Stretto.Web/src/pages/EventDetailPage.tsx`: fetches event by route param `id` using `useQuery` calling `EventsService.apiEventsIdGet`; displays a card with: type badge (Rehearsal/Performance), date formatted as `EEEE, MMMM d, yyyy`, start time, duration in minutes, venue name (or "No venue"), link to parent project (`/projects/{projectId}`); Admin-only action buttons: "Edit" navigates to `/events/{id}/edit`, "Delete" calls `EventsService.apiEventsIdDelete` via `useMutation` then navigates to `/projects/{projectId}`; shows skeleton loader while loading; shows inline error on fetch failure

- [ ] Update `src/Stretto.Web/src/App.tsx`: add imports for `ProjectsListPage`, `ProjectFormPage`, `ProjectDetailPage`, `EventFormPage`, `EventDetailPage`; replace `<Route path="/projects" element={<ComingSoon />} />` with individual routes: `/projects` → `ProjectsListPage`, `/projects/new` → `ProjectFormPage`, `/projects/:id` → `ProjectDetailPage`, `/projects/:id/edit` → `ProjectFormPage`; add new routes inside the protected block: `/events/new` → `EventFormPage`, `/events/:id` → `EventDetailPage`, `/events/:id/edit` → `EventFormPage`
