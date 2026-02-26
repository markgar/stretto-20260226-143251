## Milestone: Notifications – API Controller and Frontend

> **Validates:** After deploying, the following must work:
> - `POST /api/notifications/assignment-announcement` with `{ "programYearId": "<guid>", "subject": "Hello", "body": "Test" }` returns HTTP 204 (admin auth required)
> - `GET /api/notifications/assignment-recipients?programYearId=<guid>` returns HTTP 200 with a JSON array of recipient objects (admin auth required)
> - `POST /api/notifications/audition-announcement` with `{ "auditionDateId": "<guid>", "subject": "Auditions Open", "body": "Come audition" }` returns HTTP 204 (admin auth required)
> - `GET /api/notifications/audition-recipients?auditionDateId=<guid>` returns HTTP 200 with a JSON array
> - Navigating to `/notifications` as an authenticated admin renders the Notifications page with a type selector and a Send button (data-testid="notifications-heading")

> **Reference files:**
> - Controller: `src/Stretto.Api/Controllers/ProjectMaterialsController.cs`
> - Frontend page: `src/Stretto.Web/src/pages/VenuesListPage.tsx`
> - Routing: `src/Stretto.Web/src/App.tsx`

> **Prerequisite:** milestone-15a-notifications-backend must be complete before starting this milestone.

- [x] Create `NotificationsController` in `src/Stretto.Api/Controllers/NotificationsController.cs` extending `ProtectedControllerBase`; route prefix `api/notifications`; all four endpoints require Admin role (throw `ForbiddenException` otherwise): `GET /api/notifications/assignment-recipients?programYearId={id}` → `Ok(await _notifications.GetAssignmentRecipientsAsync(programYearId, orgId))`; `POST /api/notifications/assignment-announcement` body `SendAssignmentAnnouncementRequest` → `NoContent()`; `GET /api/notifications/audition-recipients?auditionDateId={id}` → `Ok(await _notifications.GetAuditionRecipientsAsync(auditionDateId, orgId))`; `POST /api/notifications/audition-announcement` body `SendAuditionAnnouncementRequest` → `NoContent()`

- [ ] Run `npm run generate` in `src/Stretto.Web` to regenerate the TypeScript API client from the updated OpenAPI spec

- [ ] Create `src/Stretto.Web/src/pages/NotificationsPage.tsx`; use Zod schema and React Hook Form for the compose form; include a `type` field (select: `"assignment"` or `"audition"`), a program year or audition date selector (fetched via `useQuery`), `subject` and `body` text inputs, a "Preview Recipients" button that calls the recipient query and renders a list of names/emails, and a "Send Announcement" submit button wired to `useMutation`; include `data-testid="notifications-heading"` on the page heading

- [ ] Update `src/Stretto.Web/src/App.tsx` to replace the `<ComingSoon />` placeholder at `/notifications` with `<NotificationsPage />`  and add the corresponding import
