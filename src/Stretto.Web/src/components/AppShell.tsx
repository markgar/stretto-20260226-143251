import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { adminNavItems, memberNavItems } from '../nav';
import { cn } from '../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const navItems = user?.role === 'Admin' ? adminNavItems : memberNavItems;
  const tabItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar (lg+): fixed 240px */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:flex-col lg:border-r lg:bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold truncate">{user?.orgName ?? 'Stretto'}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t px-4 py-3 text-sm">
          <p className="font-medium truncate">
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </p>
          <p className="text-muted-foreground">{user?.role}</p>
        </div>
      </aside>

      {/* Tablet sidebar (md to lg): 64px collapsed, 240px expanded */}
      <aside
        className={cn(
          'hidden md:flex lg:hidden fixed inset-y-0 left-0 flex-col border-r bg-card z-20 transition-all duration-200',
          sidebarExpanded ? 'w-60' : 'w-16',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-2">
          {sidebarExpanded && (
            <span className="font-semibold truncate flex-1 px-2">{user?.orgName ?? 'Stretto'}</span>
          )}
          <button
            onClick={() => setSidebarExpanded((v) => !v)}
            className="p-2 rounded hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            {sidebarExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarExpanded && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t px-2 py-3 text-sm">
          {sidebarExpanded ? (
            <>
              <p className="font-medium truncate">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </p>
              <p className="text-muted-foreground">{user?.role}</p>
            </>
          ) : (
            <div className="h-8" />
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-60 md:ml-16 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar (below md) */}
      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t bg-card z-20">
        {tabItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center py-2 text-xs gap-1',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
