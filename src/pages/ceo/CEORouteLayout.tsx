import { Outlet } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';

/**
 * Wraps all /ceo/* routes with CEO role check,
 * so individual CEO pages don't need AdminRoute.
 */
const CEORouteLayout = () => (
  <AdminRoute requiredRole="ceo">
    <Outlet />
  </AdminRoute>
);

export default CEORouteLayout;
