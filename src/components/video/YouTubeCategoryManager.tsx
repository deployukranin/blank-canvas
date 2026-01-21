import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, Search, Tags, ChevronDown, ChevronUp } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

export type YouTubeCategoryDraft = {
  id: string;
  name: string;
  icon?: string;
  order?: number;
};

export type YouTubeCategorizationDraft = {
  categories: YouTubeCategoryDraft[];
  videoCategoryMap: Record<string, string | undefined>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);

const normalizeForSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function YouTubeCategoryManager({
  videos,
  draft,
  onChange,
  onSave,
  isSaving,
}: {
  videos: YouTubeVideoItem[];
  draft: YouTubeCategorizationDraft;
  onChange: (next: YouTubeCategorizationDraft) => void;
  onSave: () => void;
  isSaving?: boolean;
}) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🎬");
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const categoriesSorted = useMemo(() => {
    return [...(draft.categories ?? [])].sort((a, b) => {
      const ao = a.order ?? 9999;
      const bo = b.order ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }, [draft.categories]);

  const filteredVideos = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return videos;
    return videos.filter((v) => normalizeForSearch(v.video_title).includes(q));
  }, [query, videos]);

  const addCategory = () => {
    const name = newName.trim();
    if (!name) return;

    const baseId = slugify(name) || `cat-${Date.now()}`;
    const exists = draft.categories.some((c) => c.id === baseId);
    const id = exists ? `${baseId}-${Date.now()}` : baseId;

    onChange({
      ...draft,
      categories: [
        ...draft.categories,
        {
          id,
          name,
          icon: newIcon.trim() || "🎬",
          order: draft.categories.length + 1,
        },
      ],
    });

    setNewName("");
    setNewIcon("🎬");
  };

  const setMapping = (videoId: string, categoryId?: string) => {
    onChange({
      ...draft,
      videoCategoryMap: {
        ...draft.videoCategoryMap,
        [videoId]: categoryId,
      },
    });
  };

  const visibleVideos = filteredVideos.slice(0, query.trim() ? 80 : 40);

  // Count categorized videos
  const categorizedCount = Object.values(draft.videoCategoryMap).filter(Boolean).length;

  return (
    <GlassCard className="p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tags className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Categorias dos vídeos</h3>
            <p className="text-sm text-muted-foreground">
              {categoriesSorted.length} categorias • {categorizedCount} vídeos organizados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors hover:bg-muted">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-6 border-t border-border mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={onSave} disabled={isSaving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Criar categoria</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="sm:w-24"
                      placeholder="🎭"
                      aria-label="Ícone"
                    />
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Roleplay"
                      aria-label="Nome da categoria"
                    />
                    <Button type="button" variant="secondary" className="gap-2" onClick={addCategory} disabled={!newName.trim()}>
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Vincular vídeos</Label>

                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9"
                      placeholder="Buscar vídeo pelo título..."
                      aria-label="Buscar vídeos"
                    />
                  </div>

                  <div className="space-y-2">
                    {visibleVideos.map((v, idx) => {
                      const NONE_VALUE = "__none__";
                      const selected = draft.videoCategoryMap[v.video_id] ?? NONE_VALUE;

                      return (
                        <motion.div
                          key={v.video_id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <img
                            src={v.thumbnail_url}
                            alt={v.video_title}
                            className="w-20 aspect-video rounded-md object-cover"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{v.video_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(v.published_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="w-44">
                            <Select
                              value={selected}
                              onValueChange={(val) => setMapping(v.video_id, val === NONE_VALUE ? undefined : val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE_VALUE}>Sem categoria</SelectItem>
                                {categoriesSorted.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.icon ? `${c.icon} ` : ""}
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      );
                    })}

                    {!visibleVideos.length ? (
                      <p className="text-xs text-muted-foreground">Nenhum vídeo encontrado.</p>
                    ) : null}

                    {!query.trim() && videos.length > 40 ? (
                      <p className="text-xs text-muted-foreground">
                        Mostrando 40 vídeos para vinculação (para não ficar pesado). Use a busca para achar os outros.
                      </p>
                    ) : null}

                    {query.trim() && filteredVideos.length > 80 ? (
                      <p className="text-xs text-muted-foreground">Mostrando 80 resultados (refine a busca para ver mais).</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
