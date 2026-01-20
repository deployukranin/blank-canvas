import { useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Bell } from "lucide-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilConfiguracoesPage() {
  const { user, isAuthenticated, applyLocalProfile } = useAuth();

  useEffect(() => {
    document.title = "Configurações do Perfil | ASMR Luna";
  }, []);

  return (
    <MobileLayout title="Configurações" showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Configurações do perfil</h1>
          <p className="text-sm text-muted-foreground">Ajuste preferências do app e do seu perfil.</p>
        </header>

        {isAuthenticated && user && (
          <ProfileEditor
            userId={user.id}
            fallbackUsername={user.username}
            onProfileApplied={applyLocalProfile}
          />
        )}

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium">Preferências</h2>
                <p className="text-xs text-muted-foreground">Essas preferências ficam salvas no seu dispositivo.</p>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          aria-label="Notificações"
          className="space-y-2"
        >
          <div className="flex items-center gap-2 px-1">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">Notificações</h2>
          </div>
          <PushNotificationToggle variant="card" />
        </motion.section>
      </main>
    </MobileLayout>
  );
}
