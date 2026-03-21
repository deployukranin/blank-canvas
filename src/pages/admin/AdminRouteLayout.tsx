import { Outlet } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';

/**
 * Wraps all /admin/* routes with admin role check,
 * so individual admin pages don't need AdminRoute.
 */
const AdminRouteLayout = () => (
  <AdminRoute requiredRole="admin">
    <Outlet />
  </AdminRoute>
);

export default AdminRouteLayout;
