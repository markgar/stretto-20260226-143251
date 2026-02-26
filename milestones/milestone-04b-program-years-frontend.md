## Milestone: Program Years – Frontend

> **Validates:**
> - Admin navigating to `/program-years` sees a list page with `data-testid="program-years-list"`
> - Admin navigating to `/program-years/new` sees a create form with `data-testid="program-year-form"`
> - Admin navigating to `/program-years/{id}` sees a detail page with `data-testid="program-year-detail"`

> **Reference files:**
> - `src/Stretto.Web/src/App.tsx` — route file to extend with program year routes
> - `src/Stretto.Web/src/pages/DashboardPage.tsx` — page pattern (AppShell wrapper, data-testid on heading)

- [ ] Run `npm run generate` in `src/Stretto.Web` to regenerate the TypeScript API client from the updated OpenAPI spec into `src/api/generated/`

- [ ] Install `@tanstack/react-query` in `src/Stretto.Web` with `npm install @tanstack/react-query` and wrap the app in `QueryClientProvider` in `src/Stretto.Web/src/main.tsx`

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearsPage.tsx`; use `useQuery` to call `GET /api/program-years`; render `<AppShell>` with heading `data-testid="program-years-list"`, a "New Program Year" button linking to `/program-years/new`, and a table/list of program years showing Name, StartDate, EndDate, a "Current" badge if `isCurrent`, an "Archived" badge if `isArchived`; each row has a "View" link to `/program-years/{id}`, an "Archive" button (calls `POST /api/program-years/{id}/archive` then invalidates the query) hidden when already archived, and an "Activate" button (calls `POST /api/program-years/{id}/mark-current` then invalidates) hidden when already current or archived

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearCreatePage.tsx`; define Zod schema `z.object({ name: z.string().min(1), startDate: z.string(), endDate: z.string() })`; use `useForm` + `zodResolver`; on valid submit call `POST /api/program-years` via `useMutation`; on success navigate to `/program-years`; render `<AppShell>` with a form `data-testid="program-year-form"` containing inputs for Name, Start Date, End Date with `data-testid` attributes (`name-input`, `start-date-input`, `end-date-input`) and a Submit button

- [ ] Create `src/Stretto.Web/src/pages/ProgramYearDetailPage.tsx`; use `useParams` to get `id`; use `useQuery` to fetch `GET /api/program-years/{id}`; render `<AppShell>` with a container `data-testid="program-year-detail"` showing Name, dates, status badges; include an inline edit form (same fields as create) pre-populated with current values using `useForm`; on submit call `PUT /api/program-years/{id}` via `useMutation` and invalidate query; show Archive / Activate action buttons consistent with the list page

- [ ] Update `src/Stretto.Web/src/App.tsx` to replace the `/program-years` `ComingSoon` route with `ProgramYearsPage`, and add new protected routes for `/program-years/new` → `ProgramYearCreatePage` and `/program-years/:id` → `ProgramYearDetailPage`
