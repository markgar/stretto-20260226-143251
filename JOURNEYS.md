# Stretto — User Journey Tests

## J-1: Smoke — Login and Navigate the App Shell
<!-- after: 3 -->
<!-- covers: auth.login, navigation, health -->
<!-- tags: smoke -->
Open the app unauthenticated → verify redirect to login page → enter admin email (mgarner22@gmail.com) → submit login form → verify cookie is set and redirect to dashboard → confirm sidebar shows organization name "My Choir" and all admin nav links (Dashboard, Program Years, Projects, Utilization Grid, Members, Auditions, Venues, Notifications) → click each top-level nav link and verify the page loads without errors → confirm user name and role appear at the bottom of the sidebar → verify GET /health returns 200.

## J-2: Admin Creates a Program Year and Projects
<!-- after: 7 -->
<!-- covers: program-years.crud, projects.crud, navigation -->
Login as admin → navigate to Program Years → create a new program year "2026-2027" → mark it as current → verify it appears with a "current" indicator in the list → navigate into the program year → create project "Spring Concert" with start date, end date, and description → verify project appears in the program year's project list → open project detail and confirm tabs (Overview, Events, Materials, Members) are present → edit the project name → verify the update is reflected → navigate back to Program Years list and archive the program year → verify it shows as archived.

## J-3: Admin Manages Members
<!-- after: 5 -->
<!-- covers: members.crud -->
Login as admin → navigate to Members → verify the existing seed member (mgarner@outlook.com) appears in the list → use the search box to filter by name/email → manually add a new member with name and email → verify the new member appears in the list with an active status badge → open the member's profile page → verify assignment summary is shown → edit the member's name → verify the update is saved → deactivate the member → verify their status badge changes to inactive.

## J-4: Admin Manages Venues and Schedules Events
<!-- after: 9 -->
<!-- covers: venues.crud, events.crud, projects.crud -->
Login as admin → navigate to Venues → create a new venue "Orchestra Hall" with address and contact details (name, email, phone) → verify venue appears in the list → edit the venue's contact email → verify the update is saved → navigate to Projects → open an existing project → go to the Events tab → create a Rehearsal event (type=Rehearsal, date within project range, start time, duration, venue=Orchestra Hall) → verify the event appears in the list with the correct type badge → create a Performance event → verify both events are listed → edit the Rehearsal's start time → verify the update is reflected → delete the Performance event → verify it is removed from the list.

## J-5: Assign Members to Projects and View Utilization Grid
<!-- after: 8 -->
<!-- covers: assignments, utilization-grid, members.crud, projects.crud -->
Login as admin → navigate to a project's Members tab → browse the full member list in the assignment panel → search for a member by name → toggle assignment on for two members → verify the assigned members appear in the project's member list → navigate to a second project and assign one of the same members → navigate to Utilization Grid → verify the matrix shows members as rows and projects as columns → confirm filled cells appear for assigned members → verify members are sorted by utilization (most-assigned at top) → confirm utilization count/percentage is displayed per row → on a narrow viewport, verify the grid switches to a list-by-member layout.

## J-6: Admin Sets Up Audition Dates and Slots
<!-- after: 11 -->
<!-- covers: auditions.setup, program-years.crud -->
Login as admin → navigate to Auditions → select the current program year → create an audition date with start time 9:00 AM, end time 11:00 AM, block length 15 minutes → verify 8 time slots are generated automatically → attempt to create an audition date with a block length that does not divide evenly (e.g., 7 minutes into a 2-hour window) → verify the API returns a validation error → open the slot grid for the valid audition date → confirm slots are displayed with Pending (amber) status → click a slot → enter notes for that slot → change its status to Accepted (green) → change another slot to Rejected (red) → change another to Waitlisted (blue) → verify color-coded status badges update correctly.

## J-7: New Member Signs Up for an Audition
<!-- after: 12 -->
<!-- covers: auditions.signup, auth.login, members.crud -->
Open the public audition listing page without logging in → browse available slots for an audition date → select an open slot → enter a new email address in the sign-up form → submit → verify a confirmation page is shown → verify a new member record was created for that email → attempt to sign up for the same slot with a different email → verify the slot is rejected as already taken → login as admin → navigate to Auditions and confirm the slot shows the member's email → verify the member now appears in the Members list.

## J-8: Admin Adds Project Materials; Member Views Them
<!-- after: 13 -->
<!-- covers: materials.links, materials.documents, member.projects -->
Login as admin → navigate to a project's Materials tab → add a link with title "Reference Recording" and a valid URL → verify the link appears in the materials list → add a second link → upload a PDF document → verify the document appears in the list with a download button → delete one link → verify it is removed → logout → login as the member (mgarner@outlook.com) who is assigned to that project → navigate to My Projects → open the project → view the Materials section → verify the remaining link and the document are visible → click the link → verify navigation to the external URL → download the document → verify the file is served.

## J-9: Event Attendance — Check-In and Admin View
<!-- after: 10 -->
<!-- covers: attendance.checkin, attendance.admin, events.crud, member.projects -->
Login as admin → open a project's Events tab → note the unique check-in URL for a Rehearsal event → logout → open the check-in URL directly (simulating a QR code scan) → verify the mobile-optimized check-in page loads with no navigation chrome → login as the member → tap the full-width "I'm here" button → verify the button turns green with a checkmark and attendance is marked Present → login as admin → navigate to the event detail's attendance view → verify the member's status shows Present (green badge) → mark a second assigned member as Excused from the admin view → verify Excused badge appears → mark a third as Absent → verify Absent (red) badge appears → login as the member → navigate to an upcoming event from My Projects → toggle the excused-absence option before the event → verify the status updates to Excused.

## J-10: Member Browses Projects, Calendar, and Profile
<!-- after: 14 -->
<!-- covers: member.projects, member.calendar, member.profile, assignments -->
Login as member (mgarner@outlook.com) → navigate to My Projects → verify the list shows only projects to which this member is assigned → click into a project → view upcoming events listed in order → verify event type badges and venue names are shown → navigate to My Calendar → verify upcoming events from all assigned projects are displayed grouped by date → click the iCal export/subscribe link → verify a .ics file is returned with correct calendar events → navigate to Profile → edit the member's display name → save → verify the name updates in the sidebar → toggle notification opt-out → verify the preference is saved.

## J-11: Admin Sends Notifications and Member Unsubscribes
<!-- after: 15 -->
<!-- covers: notifications.announcements, member.profile, assignments, program-years.crud -->
Login as admin → navigate to Notifications → select "Assignment Announcement" → choose the current program year → verify the recipient preview lists all assigned members → send the announcement → verify a success confirmation is shown (stub — no actual email) → select "Audition Announcement" → choose an audition date → preview recipients → send → verify confirmation → login as the member → navigate to Profile → toggle notification opt-out off → save → login as admin → send another announcement → verify the opted-out member does not appear in the recipient preview.

## J-12: Admin Dashboard Shows Current-Year Summary
<!-- after: 16 -->
<!-- covers: dashboard, program-years.crud, events.crud, auditions.setup, attendance.admin -->
Login as admin → land on the Dashboard page → verify the current program year is selected by default → confirm upcoming events (within the next 30 days) are listed with date, project name, venue, and event type → confirm a recent activity feed shows newly signed-up audition members and new assignments → use the program year selector to switch to a different year → verify the dashboard refreshes to show that year's data → verify skeleton loaders appear briefly while data loads → verify a friendly empty state is shown if no events are scheduled in a year with no data.

## J-13: Full Concert Lifecycle — End-to-End
<!-- after: 16 -->
<!-- covers: program-years.crud, projects.crud, members.crud, venues.crud, events.crud, assignments, auditions.setup, auditions.signup, attendance.checkin, attendance.admin, materials.links, materials.documents, member.projects, member.calendar, notifications.announcements, dashboard -->
Login as admin → create program year "2027-2028" and mark it current → create venue "First Lutheran Church" → create project "Fall Gala" within that year → navigate to Auditions and create an audition date with valid block length → new user signs up for a slot via the public audition page (creates new member) → login as admin, set audition slot status to Accepted → assign the new member (and the seed member) to "Fall Gala" → add a rehearsal event and a performance event, both linked to "First Lutheran Church" → add project materials (one link, one document) → navigate to the Utilization Grid and verify both members appear with correct assignment counts → send an assignment announcement from Notifications → login as member → view My Projects → open "Fall Gala" → view materials and download the document → check the My Calendar page → open the check-in URL for the rehearsal → mark attendance as Present → login as admin → view event attendance for the rehearsal and confirm Present status → visit the Dashboard → confirm the upcoming performance appears in the summary.
