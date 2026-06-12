import { useUserRole } from '@/hooks/use-user-role';
import SuperAdminTenants from './SuperAdminTenants';
import SuperAdminClients from './SuperAdminClients';
import SuperAdminPartners from './SuperAdminPartners';
import SuperAdminReferrals from './SuperAdminReferrals';
import SuperAdminRanking from './SuperAdminRanking';
import SuperAdminSuporte from './SuperAdminSuporte';
import {
  TrackerTenants, TrackerClients, TrackerPartners,
  TrackerReferrals, TrackerRanking, TrackerSupport,
} from './tracker/TrackerPortalPages';

/**
 * Each section renders the Super Admin (CEO) version for super_admin,
 * and the isolated, read-only tracker version for trackers.
 */
const useTrackerOnly = () => {
  const { isSuperAdmin, isTracker } = useUserRole();
  return isTracker() && !isSuperAdmin();
};

export const TenantsSection = () => (useTrackerOnly() ? <TrackerTenants /> : <SuperAdminTenants />);
export const ClientsSection = () => (useTrackerOnly() ? <TrackerClients /> : <SuperAdminClients />);
export const PartnersSection = () => (useTrackerOnly() ? <TrackerPartners /> : <SuperAdminPartners />);
export const ReferralsSection = () => (useTrackerOnly() ? <TrackerReferrals /> : <SuperAdminReferrals />);
export const RankingSection = () => (useTrackerOnly() ? <TrackerRanking /> : <SuperAdminRanking />);
export const SupportSection = () => (useTrackerOnly() ? <TrackerSupport /> : <SuperAdminSuporte />);
