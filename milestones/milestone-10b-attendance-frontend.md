# Milestone: Attendance — Frontend

> **Validates:** After deployment, the validator should confirm:
> - Frontend: `GET /checkin/{eventId}` page renders a full-width button with `data-testid="checkin-button"` (no nav chrome / AppShell)
> - Frontend: `GET /events/{eventId}` page renders `data-testid="attendance-panel"` when logged in as Admin
> - `GET /health` returns `{"status":"healthy"}`

> **Reference files:**
> - Page pattern: `src/Stretto.Web/src/pages/EventDetailPage.tsx`
> - App routing: `src/Stretto.Web/src/App.tsx`

## Tasks

- [x] Run `npm run generate` in `src/Stretto.Web/` to regenerate the TypeScript API client from the updated OpenAPI spec; verify `src/Stretto.Web/src/api/generated/` contains updated `AttendanceService` or equivalent client methods

- [x] Add `/checkin/:eventId` route to `src/Stretto.Web/src/App.tsx` inside the `<Route element={<ProtectedRoute />}>` block, pointing to a new `CheckInPage` component imported from `./pages/CheckInPage`

- [ ] Create `src/Stretto.Web/src/pages/CheckInPage.tsx` — no `AppShell`; full-height centered layout (`min-h-screen flex flex-col items-center justify-center p-6`); shows "Check In" as a heading; uses `useParams` to get `eventId`; renders a full-width green button (`data-testid="checkin-button"`, `className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-semibold py-6 rounded-xl"`) labeled "I'm here"; uses `useMutation` to call `POST /api/checkin/{eventId}`; on success, replaces button with a `<p data-testid="checkin-success">You're checked in!</p>` message; shows error text on failure

- [ ] Update `src/Stretto.Web/src/pages/EventDetailPage.tsx` to add an admin attendance panel — when `isAdmin` is true, render a section below event details with `data-testid="attendance-panel"`; fetch `GET /api/events/{eventId}/attendance` via `useQuery`; render a list of members with their status badges: Present=green badge, Excused=amber badge, Absent=red badge, null="—" gray; each row includes a `<select>` or set of buttons to update status via `useMutation` calling `PUT /api/events/{eventId}/attendance/{memberId}` with `{status: "Present"|"Excused"|"Absent"}`; include a check-in URL display: `<span data-testid="checkin-url">/checkin/{eventId}</span>` that admins can copy to share with members

- [ ] Update `src/Stretto.Web/src/pages/EventDetailPage.tsx` to add a member excused-absence section — when `user?.role === 'Member'`, fetch the member's own attendance status from `GET /api/events/{eventId}/attendance` and find their entry by memberId; render their current status badge; render a toggle button `data-testid="excuse-toggle"` labeled "Excuse my absence" (if not currently Excused) or "Remove excuse" (if Excused) that calls `PUT /api/events/{eventId}/attendance/me/excused` via `useMutation`
