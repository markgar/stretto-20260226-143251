# Milestone: Auditions — Admin Setup (Frontend)

> **Validates:**
> - React app: `/auditions` renders the Auditions list page (heading visible, program year selector present)
> - React app: `/auditions/new` renders the create audition date form (date, startTime, endTime, blockLengthMinutes fields)
> - React app: `/auditions/{id}` renders the slot grid page with color-coded status badges

> **Reference files:**
> - Frontend list page: `src/Stretto.Web/src/pages/VenuesListPage.tsx`
> - Frontend form page: `src/Stretto.Web/src/pages/VenueFormPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`
> - Generated API client: `src/Stretto.Web/src/api/generated/`

---

- [ ] Create `AuditionsListPage` in `src/Stretto.Web/src/pages/AuditionsListPage.tsx`; fetch program years via generated client to populate a `<select data-testid="program-year-select">` selector; on selection fetch audition dates via `GET /api/audition-dates?programYearId=`; render a table with columns Date, Start, End, Block (minutes), Actions (View, Delete); heading `data-testid="auditions-heading"`; link to `/auditions/new` with `data-testid="add-audition-date-button"` kept to ≤40 lines per function
- [ ] Create `AuditionDateCreatePage` in `src/Stretto.Web/src/pages/AuditionDateCreatePage.tsx`; use React Hook Form + Zod schema with fields: `programYearId` (required Guid), `date` (required string in YYYY-MM-DD), `startTime` (required HH:mm), `endTime` (required HH:mm), `blockLengthMinutes` (required int min 5); on submit POST to `/api/audition-dates`, on success navigate to `/auditions/{newId}`; keep functions ≤40 lines
- [ ] Create `AuditionSlotGridPage` in `src/Stretto.Web/src/pages/AuditionSlotGridPage.tsx`; fetch `GET /api/audition-dates/{id}` on mount; render a grid of slot cards showing `SlotTime`, status badge with color-coding (Pending=amber bg, Accepted=green bg, Rejected=red bg, Waitlisted=blue bg) via Tailwind classes; each card carries `data-testid={`slot-${slot.id}`}`; keep functions ≤40 lines
- [ ] Add inline notes editor to `AuditionSlotGridPage`: each slot card shows a textarea pre-filled with `slot.notes`; on blur call `PATCH /api/audition-dates/{dateId}/slots/{slotId}/notes` with `{ notes }` and invalidate the query; textarea carries `data-testid={`notes-${slot.id}`}`
- [ ] Add status update dropdown to `AuditionSlotGridPage`: each slot card includes a `<select>` with options Pending, Accepted, Rejected, Waitlisted; on change call `PATCH /api/audition-dates/{dateId}/slots/{slotId}/status` with `{ status }` and invalidate the query; select carries `data-testid={`status-${slot.id}`}`
- [ ] Add auditions routes in `src/Stretto.Web/src/App.tsx`: replace the `<Route path="/auditions" element={<ComingSoon />} />` placeholder with `<Route path="/auditions" element={<AuditionsListPage />} />`, add `<Route path="/auditions/new" element={<AuditionDateCreatePage />} />` and `<Route path="/auditions/:id" element={<AuditionSlotGridPage />} />`
- [ ] Fix `VenuesListPage` and `VenueFormPage` to use the generated `VenuesService` API client instead of raw `fetch()`, check `response.ok` (or equivalent) on all calls, and refactor each component function to stay within ~40 lines by extracting small helper functions or sub-components (addresses findings #94, #97, #98)
