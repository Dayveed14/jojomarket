import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

/** UX guard only — every API route enforces auth and roles on the server. */
export function ProtectedRoute({ roles, loginPath = '/login' }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Spinner label="Checking your session" />;
  if (!user) return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

/** Sends signed-in users away from login/register to their dashboard. */
export function GuestOnly() {
  const { user, status } = useAuth();
  if (status === 'loading') return <Spinner />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
