import {
  LayoutDashboard,
  CalendarDays,
  FolderOpen,
  Grid3x3,
  Users,
  Mic2,
  MapPin,
  Bell,
  Calendar,
  User,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Program Years', to: '/program-years', icon: CalendarDays },
  { label: 'Projects', to: '/projects', icon: FolderOpen },
  { label: 'Utilization Grid', to: '/utilization', icon: Grid3x3 },
  { label: 'Members', to: '/members', icon: Users },
  { label: 'Auditions', to: '/auditions', icon: Mic2 },
  { label: 'Venues', to: '/venues', icon: MapPin },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

export const memberNavItems: NavItem[] = [
  { label: 'My Projects', to: '/my-projects', icon: FolderOpen },
  { label: 'My Calendar', to: '/my-calendar', icon: Calendar },
  { label: 'Auditions', to: '/auditions', icon: Mic2 },
  { label: 'Profile', to: '/profile', icon: User },
];
