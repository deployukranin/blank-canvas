import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { basePath } = useTenant();

  useEffect(() => {
    navigate(`${basePath}/admin`, { replace: true });
  }, [navigate, basePath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AdminLogin;
