interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'ceo';
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  return <>{children}</>;
};
