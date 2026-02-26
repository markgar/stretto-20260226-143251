import { useEffect, useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VenuesListPage from './pages/VenuesListPage';
import VenueFormPage from './pages/VenueFormPage';
import ProgramYearsListPage from './pages/ProgramYearsListPage';
import ProgramYearCreatePage from './pages/ProgramYearCreatePage';
import ProgramYearDetailPage from './pages/ProgramYearDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import { useAuthStore } from './stores/authStore';

function ComingSoon() {
  return (
    <AppShell>
      <p className="p-6">Coming soon</p>
    </AppShell>
  );
}

function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/validate', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) setUser(user);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, [setUser]);

  if (!authChecked) return null;

  return (
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
        <Route path="/members" element={<ComingSoon />} />
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
  );
}

export default App;
