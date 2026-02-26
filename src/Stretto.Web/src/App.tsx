import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuditionSignUpPage from './pages/AuditionSignUpPage';
import AuditionConfirmationPage from './pages/AuditionConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import VenuesListPage from './pages/VenuesListPage';
import VenueFormPage from './pages/VenueFormPage';
import ProgramYearsListPage from './pages/ProgramYearsListPage';
import ProgramYearCreatePage from './pages/ProgramYearCreatePage';
import ProgramYearDetailPage from './pages/ProgramYearDetailPage';
import MembersListPage from './pages/MembersListPage';
import MemberFormPage from './pages/MemberFormPage';
import MemberProfilePage from './pages/MemberProfilePage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import EventFormPage from './pages/EventFormPage';
import EventDetailPage from './pages/EventDetailPage';
import CheckInPage from './pages/CheckInPage';
import UtilizationGridPage from './pages/UtilizationGridPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import { AuthInitializer } from './components/AuthInitializer';

function ComingSoon() {
  return (
    <AppShell>
      <p className="p-6">Coming soon</p>
    </AppShell>
  );
}

function App() {
  return (
    <AuthInitializer>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auditions/:auditionDateId" element={<AuditionSignUpPage />} />
        <Route path="/auditions/confirmation" element={<AuditionConfirmationPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/program-years" element={<ProgramYearsListPage />} />
          <Route path="/program-years/new" element={<ProgramYearCreatePage />} />
          <Route path="/program-years/:id" element={<ProgramYearDetailPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/checkin/:eventId" element={<CheckInPage />} />
          <Route path="/utilization" element={<UtilizationGridPage />} />
          <Route path="/members" element={<MembersListPage />} />
          <Route path="/members/new" element={<MemberFormPage />} />
          <Route path="/members/:id/edit" element={<MemberFormPage />} />
          <Route path="/members/:id" element={<MemberProfilePage />} />
          <Route path="/auditions" element={<ComingSoon />} />
          <Route path="/venues" element={<VenuesListPage />} />
          <Route path="/venues/new" element={<VenueFormPage />} />
          <Route path="/venues/:id/edit" element={<VenueFormPage />} />
          <Route path="/notifications" element={<ComingSoon />} />
          <Route path="/my-projects" element={<ComingSoon />} />
          <Route path="/my-calendar" element={<ComingSoon />} />
          <Route path="/profile" element={<ComingSoon />} />
        </Route>
      </Routes>
    </AuthInitializer>
  );
}

export default App;
