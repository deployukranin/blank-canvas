import { useUserRole } from '@/hooks/use-user-role';
import SuperAdminDashboard from './SuperAdminDashboard';
import TrackerDashboard from './TrackerDashboard';

/**
 * /admin-master home. Same URL for everyone; the dashboard shown depends on the role:
 * - Super Admin → full platform dashboard
 * - Tracker → own isolated tracking dashboard
 */
const AdminMasterHome: React.FC = () => {
  const { isSuperAdmin, isTracker } = useUserRole();
  if (isTracker() && !isSuperAdmin()) return <TrackerDashboard />;
  return <SuperAdminDashboard />;
};

export default AdminMasterHome;
