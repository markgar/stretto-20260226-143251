## Milestone: Authentication — App Shell

> **Validates:**
> - Frontend at `/login` renders an email input (`data-testid="email-input"`) and a submit button (`data-testid="login-button"`)
> - Submitting the login form with `mgarner22@gmail.com` redirects to `/dashboard` and renders a heading with `data-testid="dashboard-heading"`
> - Navigating directly to `/dashboard` without being logged in redirects to `/login`

> **Reference files:**
> - `src/Stretto.Web/src/App.tsx` — root route file to update with login/dashboard routes
> - `src/Stretto.Web/src/lib/utils.ts` — `cn` helper to use in new components

- [x] Install npm packages in `src/Stretto.Web`: `npm install zustand react-hook-form @hookform/resolvers zod`

- [x] Create `src/Stretto.Web/src/stores/authStore.ts`; define type `AuthUser { id: string; email: string; firstName: string; lastName: string; role: 'Admin' | 'Member'; orgId: string; orgName: string }`; create store with `create<{ user: AuthUser | null; setUser: (u: AuthUser) => void; clearUser: () => void }>(...)`; export as `useAuthStore`

- [x] Create `src/Stretto.Web/src/nav.ts`; import Lucide icons `LayoutDashboard, CalendarDays, FolderOpen, Grid3x3, Users, Mic2, MapPin, Bell, Calendar, User`; export `adminNavItems` array with eight entries (Dashboard `/dashboard`, Program Years `/program-years`, Projects `/projects`, Utilization Grid `/utilization`, Members `/members`, Auditions `/auditions`, Venues `/venues`, Notifications `/notifications`) each with `{ label, to, icon }` shape; export `memberNavItems` array with four entries (My Projects `/my-projects`, My Calendar `/my-calendar`, Auditions `/auditions`, Profile `/profile`)

- [ ] Create `src/Stretto.Web/src/pages/LoginPage.tsx`; define Zod schema `z.object({ email: z.string().email('Enter a valid email') })`; use `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`; on valid submit call `fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) })`; on 200 parse JSON, call `useAuthStore.setUser(data)`, navigate to `/dashboard`; on error show `'Invalid email or account not found'` below the form; render `<input data-testid="email-input" />` and `<button data-testid="login-button" type="submit">`

- [ ] Create `src/Stretto.Web/src/components/ProtectedRoute.tsx`; import `useAuthStore` and `Navigate`, `Outlet` from react-router-dom; props interface `{ requiredRole?: 'Admin' | 'Member' }`; if `user` is null return `<Navigate to="/login" replace />`; if `requiredRole` is set and `user.role !== requiredRole` return `<Navigate to="/dashboard" replace />`; otherwise return `<Outlet />`

- [ ] Create `src/Stretto.Web/src/components/AppShell.tsx`; uses `useAuthStore` to get current user and determine nav items (admin → `adminNavItems`, member → `memberNavItems`); renders:  (1) on desktop (lg+) a fixed left sidebar 240px wide with org name at top, nav links each showing icon + label using `NavLink` with active styling, and user name + role display at the bottom; (2) on tablet (md to lg) the same sidebar in collapsed icon-only mode (64px) with a toggle button that expands it to 240px — sidebar state stored in `useState(false)`; (3) on mobile (below md) a fixed bottom tab bar showing up to 5 nav items with icon + label; main content area adjusts left margin for sidebar (`lg:ml-60`, `md:ml-16`) and bottom padding for tab bar (`pb-16 md:pb-0`); each nav link has `data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}`

- [ ] Create `src/Stretto.Web/src/pages/DashboardPage.tsx`; returns `<AppShell><div className="p-6"><h1 data-testid="dashboard-heading" className="text-2xl font-semibold">Dashboard</h1><p className="mt-2 text-muted-foreground">Welcome to Stretto.</p></div></AppShell>`

- [ ] Update `src/Stretto.Web/src/App.tsx`: import `LoginPage`, `DashboardPage`, `ProtectedRoute`; replace the placeholder `HomePage` with a redirect from `/` to `/login`; add `<Route path="/login" element={<LoginPage />} />` as a public route; wrap `<Route path="/dashboard" element={<DashboardPage />} />` inside `<Route element={<ProtectedRoute />} />`; add further protected placeholder routes for admin (`/program-years`, `/projects`, `/utilization`, `/members`, `/auditions`, `/venues`, `/notifications`) and member (`/my-projects`, `/my-calendar`, `/profile`) each rendering a minimal `<AppShell><p>Coming soon</p></AppShell>` inline element so nav links don't 404
