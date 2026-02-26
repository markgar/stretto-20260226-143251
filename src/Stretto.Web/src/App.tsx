import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VenuesListPage from './pages/VenuesListPage';
import VenueFormPage from './pages/VenueFormPage';
import ProgramYearsListPage from './pages/ProgramYearsListPage';
import ProgramYearCreatePage from './pages/ProgramYearCreatePage';
import ProgramYearDetailPage from './pages/ProgramYearDetailPage';
import MembersListPage from './pages/MembersListPage';
import MemberFormPage from './pages/MemberFormPage';
import MemberProfilePage from './pages/MemberProfilePage';
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
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/program-years" element={<ProgramYearsListPage />} />
          <Route path="/program-years/new" element={<ProgramYearCreatePage />} />
          <Route path="/program-years/:id" element={<ProgramYearDetailPage />} />
          <Route path="/projects" element={<ComingSoon />} />
          <Route path="/utilization" element={<ComingSoon />} />
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
