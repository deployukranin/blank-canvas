import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { VideoGalleryCarousel } from "@/components/video/VideoGalleryCarousel";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

export type YouTubeCategory = {
  id: string;
  name: string;
  icon?: string;
  order?: number;
};

export type YouTubeCategorization = {
  categories: YouTubeCategory[];
  videoCategoryMap: Record<string, string | undefined>;
};

const sortByOrderThenName = (a: YouTubeCategory, b: YouTubeCategory) => {
  const ao = a.order ?? 9999;
  const bo = b.order ?? 9999;
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name);
};

export function VideoGalleryByCategory({
  videos,
  isLoading,
  onSelect,
  categorization,
  categoryPreviewLimit,
  metaById,
}: {
  videos: YouTubeVideoItem[];
  isLoading?: boolean;
  onSelect: (videoId: string) => void;
  categorization?: YouTubeCategorization;
  categoryPreviewLimit?: number | null;
  metaById?: Record<string, { isNew?: boolean; progressPercent?: number }>;
}) {
  const { t } = useTranslation();
  const categories = categorization?.categories ?? [];
  const map = categorization?.videoCategoryMap ?? {};

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const categorized = useMemo(() => {
    if (!categories.length) return null;

    const orderedCats = [...categories]
      .filter((c) => c.id && c.name)
      .sort(sortByOrderThenName);

    const byCat: Record<string, YouTubeVideoItem[]> = {};
    for (const cat of orderedCats) byCat[cat.id] = [];

    const uncategorized: YouTubeVideoItem[] = [];

    for (const v of videos) {
      const catId = map[v.video_id];
      if (catId && byCat[catId]) byCat[catId].push(v);
      else uncategorized.push(v);
    }

    return { orderedCats, byCat, uncategorized };
  }, [categories, map, videos]);

  // No categorization configured: still show as carousel.
  if (!categorization?.categories?.length) {
    return <VideoGalleryCarousel videos={videos} isLoading={isLoading} onSelect={onSelect} metaById={metaById} />;
  }

  if (isLoading) {
    return <VideoGalleryCarousel videos={videos} isLoading={true} onSelect={onSelect} metaById={metaById} />;
  }

  if (!categorized) {
    return <VideoGalleryCarousel videos={videos} isLoading={isLoading} onSelect={onSelect} metaById={metaById} />;
  }

  const limit = categoryPreviewLimit ?? null;

  return (
    <div className="space-y-8">
      {categorized.orderedCats.map((cat) => {
        const items = categorized.byCat[cat.id] ?? [];
        if (!items.length) return null;

        const isExpanded = Boolean(expanded[cat.id]);
        const visible = limit && !isExpanded ? items.slice(0, limit) : items;
        const canExpand = Boolean(limit) && items.length > (limit ?? 0) && !isExpanded;

        return (
          <section key={cat.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {cat.icon ? (
                  <span className="text-base" aria-hidden>
                    {cat.icon}
                  </span>
                ) : null}
                <h2 className="font-display text-base font-semibold">{cat.name}</h2>
              </div>

              {canExpand ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded((prev) => ({ ...prev, [cat.id]: true }))}
                >
                  {t('storefront.viewMore')}
                </Button>
              ) : null}
            </div>

            <VideoGalleryCarousel videos={visible} onSelect={onSelect} metaById={metaById} />
          </section>
        );
      })}

      {categorized.uncategorized.length > 0 && (
        <section className="space-y-3">
          {(() => {
            const key = "__uncategorized__";
            const isExpanded = Boolean(expanded[key]);
            const items = categorized.uncategorized;
            const visible = limit && !isExpanded ? items.slice(0, limit) : items;
            const canExpand = Boolean(limit) && items.length > (limit ?? 0) && !isExpanded;

            return (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden>
                      🎬
                    </span>
                    <h2 className="font-display text-base font-semibold">{t('storefront.othersCategory')}</h2>
                  </div>

                  {canExpand ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded((prev) => ({ ...prev, [key]: true }))}
                    >
                      {t('storefront.viewMore')}
                    </Button>
                  ) : null}
                </div>

                <VideoGalleryCarousel videos={visible} onSelect={onSelect} metaById={metaById} />
              </>
            );
          })()}
        </section>
      )}
    </div>
  );
}
