import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'Admin' | 'Member';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole !== undefined && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
