import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, Search, Tags, ChevronDown, ChevronUp, X, Wand2 } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  keywords?: string[];
};

export type YouTubeCategorizationDraft = {
  categories: YouTubeCategoryDraft[];
  videoCategoryMap: Record<string, string | undefined>;
  autoCategorizeEnabled?: boolean;
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

function applyAutoCategorization(
  videos: YouTubeVideoItem[],
  categories: YouTubeCategoryDraft[],
  existingMap: Record<string, string | undefined>
): Record<string, string | undefined> {
  const newMap = { ...existingMap };

  for (const video of videos) {
    // Skip if already manually categorized
    if (newMap[video.video_id]) continue;

    const titleNorm = normalizeForSearch(video.video_title);

    for (const cat of categories) {
      if (!cat.keywords?.length) continue;
      const match = cat.keywords.some((kw) =>
        titleNorm.includes(normalizeForSearch(kw))
      );
      if (match) {
        newMap[video.video_id] = cat.id;
        break;
      }
    }
  }

  return newMap;
}

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
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({});

  const autoCategorizeEnabled = draft.autoCategorizeEnabled ?? false;

  // Auto-categorize when toggled on or keywords change
  useEffect(() => {
    if (!autoCategorizeEnabled) return;
    const newMap = applyAutoCategorization(videos, draft.categories, draft.videoCategoryMap);
    // Only update if something changed
    const changed = Object.keys(newMap).some(
      (k) => newMap[k] !== draft.videoCategoryMap[k]
    );
    if (changed) {
      onChange({ ...draft, videoCategoryMap: newMap });
    }
  }, [autoCategorizeEnabled, draft.categories, videos]);

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
          keywords: [],
        },
      ],
    });

    setNewName("");
    setNewIcon("🎬");
  };

  const removeCategory = (categoryId: string) => {
    const newMap = { ...draft.videoCategoryMap };
    Object.keys(newMap).forEach((k) => {
      if (newMap[k] === categoryId) delete newMap[k];
    });
    onChange({
      ...draft,
      categories: draft.categories.filter((c) => c.id !== categoryId),
      videoCategoryMap: newMap,
    });
  };

  const addKeyword = (categoryId: string) => {
    const kw = (keywordInputs[categoryId] || "").trim();
    if (!kw) return;

    onChange({
      ...draft,
      categories: draft.categories.map((c) =>
        c.id === categoryId
          ? { ...c, keywords: [...(c.keywords || []), kw] }
          : c
      ),
    });
    setKeywordInputs((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const removeKeyword = (categoryId: string, keyword: string) => {
    onChange({
      ...draft,
      categories: draft.categories.map((c) =>
        c.id === categoryId
          ? { ...c, keywords: (c.keywords || []).filter((k) => k !== keyword) }
          : c
      ),
    });
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

  const runAutoNow = () => {
    const newMap = applyAutoCategorization(videos, draft.categories, {});
    onChange({ ...draft, videoCategoryMap: { ...draft.videoCategoryMap, ...newMap } });
  };

  const visibleVideos = filteredVideos.slice(0, query.trim() ? 80 : 40);
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
            <h3 className="font-display font-semibold text-lg">Video Categories</h3>
            <p className="text-sm text-muted-foreground">
              {categoriesSorted.length} categories • {categorizedCount} videos organized
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
              {/* Top actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={autoCategorizeEnabled}
                    onCheckedChange={(checked) =>
                      onChange({ ...draft, autoCategorizeEnabled: checked })
                    }
                  />
                  <Label className="text-sm">Auto-categorize by keywords</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runAutoNow}
                    className="gap-2"
                    disabled={!draft.categories.some((c) => c.keywords?.length)}
                  >
                    <Wand2 className="w-4 h-4" />
                    Run Now
                  </Button>
                  <Button onClick={onSave} disabled={isSaving} size="sm" className="gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Create category */}
                <div className="space-y-3">
                  <Label>Create category</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="sm:w-24"
                      placeholder="🎭"
                      aria-label="Icon"
                    />
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Roleplay"
                      aria-label="Category name"
                    />
                    <Button type="button" variant="secondary" className="gap-2" onClick={addCategory} disabled={!newName.trim()}>
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Category list with keywords */}
                {categoriesSorted.length > 0 && (
                  <div className="space-y-3">
                    <Label>Categories & Keywords</Label>
                    <div className="space-y-3">
                      {categoriesSorted.map((cat) => (
                        <div
                          key={cat.id}
                          className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {cat.icon ? `${cat.icon} ` : ""}
                              {cat.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCategory(cat.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Keywords */}
                          <div className="flex flex-wrap gap-1.5">
                            {(cat.keywords || []).map((kw) => (
                              <Badge
                                key={kw}
                                variant="secondary"
                                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                                onClick={() => removeKeyword(cat.id, kw)}
                              >
                                {kw}
                                <X className="w-3 h-3" />
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              value={keywordInputs[cat.id] || ""}
                              onChange={(e) =>
                                setKeywordInputs((prev) => ({
                                  ...prev,
                                  [cat.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addKeyword(cat.id);
                                }
                              }}
                              placeholder="Add keyword..."
                              className="text-sm h-8"
                              aria-label={`Keyword for ${cat.name}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => addKeyword(cat.id)}
                              disabled={!(keywordInputs[cat.id] || "").trim()}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video list */}
                <div className="space-y-3">
                  <Label>Link videos</Label>

                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9"
                      placeholder="Search by title..."
                      aria-label="Search videos"
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
                              {new Date(v.published_at).toLocaleDateString("en-US")}
                            </p>
                          </div>
                          <div className="w-44">
                            <Select
                              value={selected}
                              onValueChange={(val) => setMapping(v.video_id, val === NONE_VALUE ? undefined : val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE_VALUE}>No category</SelectItem>
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

                    {!visibleVideos.length && (
                      <p className="text-xs text-muted-foreground">No videos found.</p>
                    )}

                    {!query.trim() && videos.length > 40 && (
                      <p className="text-xs text-muted-foreground">
                        Showing 40 videos. Use search to find more.
                      </p>
                    )}

                    {query.trim() && filteredVideos.length > 80 && (
                      <p className="text-xs text-muted-foreground">Showing 80 results. Refine your search.</p>
                    )}
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
