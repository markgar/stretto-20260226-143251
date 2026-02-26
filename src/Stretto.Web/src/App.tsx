import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

function ComingSoon() {
  return (
    <AppShell>
      <p className="p-6">Coming soon</p>
    </AppShell>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/program-years" element={<ComingSoon />} />
        <Route path="/projects" element={<ComingSoon />} />
        <Route path="/utilization" element={<ComingSoon />} />
        <Route path="/members" element={<ComingSoon />} />
        <Route path="/auditions" element={<ComingSoon />} />
        <Route path="/venues" element={<ComingSoon />} />
        <Route path="/notifications" element={<ComingSoon />} />
        <Route path="/my-projects" element={<ComingSoon />} />
        <Route path="/my-calendar" element={<ComingSoon />} />
        <Route path="/profile" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
}

export default App;
