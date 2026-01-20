import { z } from "zod";

export const localProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(40, "Nome muito longo")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(160, "Bio muito longa")
    .optional()
    .or(z.literal("")),
  avatarDataUrl: z.string().optional().or(z.literal("")),
});

export type LocalProfile = {
  displayName?: string;
  bio?: string;
  avatarDataUrl?: string;
};

const STORAGE_KEY = "asmr_profile_by_user_v1";

type StoreShape = Record<string, LocalProfile>;

const safeParseStore = (raw: string | null): StoreShape => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StoreShape;
  } catch {
    return {};
  }
};

export const getLocalProfile = (userId: string): LocalProfile | null => {
  const store = safeParseStore(localStorage.getItem(STORAGE_KEY));
  const candidate = store[userId];
  if (!candidate) return null;

  const validated = localProfileSchema.safeParse(candidate);
  if (!validated.success) return null;

  const cleaned: LocalProfile = {
    displayName: validated.data.displayName?.trim() || undefined,
    bio: validated.data.bio?.trim() || undefined,
    avatarDataUrl: validated.data.avatarDataUrl?.trim() || undefined,
  };

  return cleaned;
};

export const saveLocalProfile = (userId: string, profile: LocalProfile) => {
  const validated = localProfileSchema.safeParse(profile);
  if (!validated.success) {
    throw new Error("Perfil inválido");
  }

  const store = safeParseStore(localStorage.getItem(STORAGE_KEY));
  store[userId] = {
    displayName: validated.data.displayName?.trim() || "",
    bio: validated.data.bio?.trim() || "",
    avatarDataUrl: validated.data.avatarDataUrl?.trim() || "",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const clearLocalProfile = (userId: string) => {
  const store = safeParseStore(localStorage.getItem(STORAGE_KEY));
  if (!store[userId]) return;
  delete store[userId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};
