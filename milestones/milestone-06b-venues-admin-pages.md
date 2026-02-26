## Milestone: Venues — Admin Pages

> **Validates:**
> - Frontend `/venues` (authenticated) renders an element with `data-testid="venues-heading"`
> - Frontend `/venues/new` renders an input with `data-testid="name-input"` and a button with `data-testid="submit-button"`

> **Reference files:**
> - `src/Stretto.Web/src/pages/LoginPage.tsx` — pattern for a page using React Hook Form + Zod + navigation
> - `src/Stretto.Web/src/App.tsx` — replace `/venues` placeholder and add `/venues/new` and `/venues/:id/edit` routes here
> - `src/Stretto.Web/src/api/generated/` — auto-generated TypeScript API client; regenerate after backend changes

- [x] Install `@tanstack/react-query` in `src/Stretto.Web`: run `npm install @tanstack/react-query` from the `src/Stretto.Web/` directory

- [x] Update `src/Stretto.Web/src/main.tsx` to set up Tanstack Query: import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`; create `const queryClient = new QueryClient()` above the render call; wrap `<BrowserRouter><App /></BrowserRouter>` in `<QueryClientProvider client={queryClient}>...</QueryClientProvider>`

- [x] Regenerate the TypeScript API client: start the backend with `dotnet run --project src/Stretto.Api/` so Swagger is available at `http://localhost:5000/swagger/v1/swagger.json`, then run `npm run generate` from `src/Stretto.Web/`; commit the generated files in `src/Stretto.Web/src/api/generated/`

- [x] Create `src/Stretto.Web/src/pages/VenuesListPage.tsx`; import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`; import `AppShell` and `Link` from react-router-dom; use `useAuthStore` to get the current user; `useQuery({ queryKey: ['venues'], queryFn: () => fetch('/api/venues', { credentials: 'include' }).then(r => r.json()) })`; render inside `<AppShell>`: heading `<h1 data-testid="venues-heading">Venues</h1>`, an `<Link to="/venues/new" data-testid="add-venue-button">Add Venue</Link>` button, and a `<table>` with columns Name, Address, Contact (shows ContactName / ContactEmail / ContactPhone joined), and Actions; each row action cell has an `<Link to={`/venues/${v.id}/edit`} data-testid={`edit-venue-${v.id}`}>Edit</Link>` and a `<button data-testid={`delete-venue-${v.id}`}>Delete</button>` that calls a `useMutation` wrapping `fetch(`/api/venues/${v.id}`, { method: 'DELETE', credentials: 'include' })` with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues'] })`

- [ ] Create `src/Stretto.Web/src/pages/VenueFormPage.tsx`; import `useParams`, `useNavigate` from react-router-dom; import `useQuery`, `useMutation` from `@tanstack/react-query`; import `useForm` and `zodResolver`; define Zod schema `z.object({ name: z.string().min(1, 'Name is required'), address: z.string().min(1, 'Address is required'), contactName: z.string().optional(), contactEmail: z.string().email('Invalid email').optional().or(z.literal('')), contactPhone: z.string().optional() })`; derive type with `z.infer`; read `id` from `useParams()`; if `id` is present, `useQuery` to `GET /api/venues/:id` and call `reset(data)` when data loads; on form submit call POST `/api/venues` or PUT `/api/venues/:id` via `useMutation` and navigate to `/venues` on success; render a form with labeled inputs: `<input data-testid="name-input" />`, `<input data-testid="address-input" />`, `<input data-testid="contact-name-input" />`, `<input data-testid="contact-email-input" />`, `<input data-testid="contact-phone-input" />`, and `<button type="submit" data-testid="submit-button">Save Venue</button>`; show inline error messages from formState.errors below each field

- [ ] Update `src/Stretto.Web/src/App.tsx`: import `VenuesListPage` and `VenueFormPage`; replace `<Route path="/venues" element={<ComingSoon />} />` with `<Route path="/venues" element={<VenuesListPage />} />`; add inside the `<Route element={<ProtectedRoute />}>` block: `<Route path="/venues/new" element={<VenueFormPage />} />` and `<Route path="/venues/:id/edit" element={<VenueFormPage />} />`
