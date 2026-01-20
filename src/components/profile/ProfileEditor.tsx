import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Trash2, User2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { clearLocalProfile, getLocalProfile, saveLocalProfile } from "@/lib/local-profile";

const schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres")
    .max(40, "Máximo de 40 caracteres")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(160, "Máximo de 160 caracteres")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ProfileEditorProps {
  userId: string;
  fallbackUsername?: string;
  onProfileApplied?: (profile: { displayName?: string; avatarDataUrl?: string }) => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

export function ProfileEditor({ userId, fallbackUsername, onProfileApplied }: ProfileEditorProps) {
  const { toast } = useToast();

  const existing = useMemo(() => getLocalProfile(userId), [userId]);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(existing?.avatarDataUrl);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: existing?.displayName || "",
      bio: existing?.bio || "",
    },
    mode: "onChange",
  });

  const displayName = form.watch("displayName")?.trim() || existing?.displayName || fallbackUsername;

  const onSelectAvatar = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Escolha uma imagem (PNG, JPG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    // Limite conservador para localStorage (evitar travar o app)
    if (file.size > 700_000) {
      toast({
        title: "Imagem muito grande",
        description: "Para o modo atual (mock), use uma imagem menor (até ~700KB).",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrl = await readAsDataUrl(file);
      setAvatarDataUrl(dataUrl);
    } catch {
      toast({
        title: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
    }
  };

  const onSave = async (values: FormValues) => {
    setIsSaving(true);
    try {
      saveLocalProfile(userId, {
        displayName: values.displayName?.trim() || "",
        bio: values.bio?.trim() || "",
        avatarDataUrl: avatarDataUrl || "",
      });

      onProfileApplied?.({
        displayName: values.displayName?.trim() || undefined,
        avatarDataUrl: avatarDataUrl || undefined,
      });

      toast({
        title: "Perfil salvo",
        description: "As mudanças foram salvas neste dispositivo.",
      });
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onReset = () => {
    clearLocalProfile(userId);
    form.reset({ displayName: "", bio: "" });
    setAvatarDataUrl(undefined);
    onProfileApplied?.({ displayName: undefined, avatarDataUrl: undefined });
    toast({ title: "Perfil limpo", description: "Voltamos ao padrão." });
  };

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <User2 className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">Seu perfil</h2>
      </div>

      <GlassCard className="p-4">
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
              {avatarDataUrl ? (
                <img
                  src={avatarDataUrl}
                  alt={displayName ? `Avatar de ${displayName}` : "Avatar do usuário"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-lg font-bold text-primary">{(displayName || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <label className="relative inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => onSelectAvatar(e.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="secondary" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Trocar foto
                  </Button>
                </label>

                {avatarDataUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => setAvatarDataUrl(undefined)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                No modo atual (mock), a foto fica salva só neste dispositivo.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Seu nome" {...form.register("displayName")} />
            {form.formState.errors.displayName && (
              <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea placeholder="Escreva uma bio curta (opcional)" rows={4} {...form.register("bio")} />
            <div className="flex items-center justify-between">
              {form.formState.errors.bio ? (
                <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
              ) : (
                <span className="text-xs text-muted-foreground">Máx. 160 caracteres</span>
              )}
              <span className="text-xs text-muted-foreground">
                {(form.watch("bio")?.length ?? 0)}/160
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" className="gap-2" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>

            <Button type="button" variant="ghost" onClick={onReset} disabled={isSaving}>
              Restaurar padrão
            </Button>
          </div>
        </form>
      </GlassCard>
    </motion.section>
  );
}
