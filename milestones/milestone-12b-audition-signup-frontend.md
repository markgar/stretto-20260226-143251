## Milestone: Audition Sign-Up — Frontend Pages

> **Validates:**
> - `GET /auditions/{auditionDateId}` (browser) renders without redirecting to login
> - `GET /auditions/confirmation` (browser) renders a confirmation message without redirecting to login

> **Reference files:**
> - `src/Stretto.Web/src/App.tsx` — route definitions; add public routes outside `ProtectedRoute`
> - `src/Stretto.Web/src/pages/LoginPage.tsx` — Zod + RHF + useMutation pattern for a public form page

- [ ] Regenerate TypeScript client: run `cd src/Stretto.Web && npm run generate` so `PublicAuditionSlotDto`, `PublicAuditionDateDto`, `AuditionSignUpRequest`, and the `/api/public/auditions` endpoints appear in `src/Stretto.Web/src/api/generated/`

- [ ] Add two public routes outside `<Route element={<ProtectedRoute />}>` in `src/Stretto.Web/src/App.tsx`: `<Route path="/auditions/:auditionDateId" element={<AuditionSignUpPage />} />` and `<Route path="/auditions/confirmation" element={<AuditionConfirmationPage />} />`; add the corresponding imports at the top of the file

- [ ] Create `src/Stretto.Web/src/pages/AuditionSignUpPage.tsx`: use `useParams` to get `auditionDateId`; call `GET /api/public/auditions/${auditionDateId}` with `useQuery` (use raw `fetch`, no credentials, since this is public); render date header (formatted date, time range); render a slot grid listing each slot's `slotTime` with an "Available" or "Taken" badge; for each available slot render a "Sign Up" button that sets a `selectedSlotId` state

- [ ] Add the sign-up form to `AuditionSignUpPage.tsx`: when `selectedSlotId` is set, render a form below the grid with Zod schema `z.object({ firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email() })`; wire with `useForm` + `zodResolver`; on submit call `POST /api/public/auditions/${selectedSlotId}/signup` with `useMutation`; on success navigate to `/auditions/confirmation` passing `{ state: { slotTime, date } }` via `useNavigate`; on API error display the `message` field from the response body

- [ ] Create `src/Stretto.Web/src/pages/AuditionConfirmationPage.tsx`: read `location.state` (via `useLocation`) for `slotTime` and `date` passed from the sign-up page; render a centred confirmation card with heading "You're signed up!", a summary line showing the formatted date and time slot, and a note "Please arrive a few minutes early"
