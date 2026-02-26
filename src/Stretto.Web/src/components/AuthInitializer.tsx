import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

// Validates the backend session on mount and syncs auth state.
// Children render immediately using localStorage-cached auth; the validate
// call runs in the background and clears the store if the session has expired.
export function AuthInitializer({ children }: AuthInitializerProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    fetch('/api/auth/validate', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
        else clearUser();
      })
      .catch(() => {});
  }, [setUser, clearUser]);

  return <>{children}</>;
}
