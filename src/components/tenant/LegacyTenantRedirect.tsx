import { Navigate, useParams } from "react-router-dom";

/**
 * Redirects legacy Portuguese tenant paths (/:slug/perfil) to their
 * current English equivalents (/:slug/profile).
 */
export const LegacyTenantRedirect = ({ to }: { to: string }) => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}/${to}`} replace />;
};

export default LegacyTenantRedirect;
