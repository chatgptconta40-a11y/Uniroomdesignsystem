import type { User, ViewMode } from '../types/auth';

export function getHomePath(user: User | null, viewMode: ViewMode): string {
  if (!user) return '/';
  if (user.type === 'admin') return '/admin';
  if (user.type === 'landlord' && viewMode === 'landlord') return '/landlord/dashboard';
  return '/dashboard';
}
