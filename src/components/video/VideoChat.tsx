import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserHandle } from "@/components/profile/UserHandle";

interface ChatMessageRow {
  id: string;
  video_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export const VideoChat = ({ videoId }: { videoId: string }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => isAuthenticated && Boolean(text.trim()) && text.trim().length <= 280,
    [isAuthenticated, text]
  );

  useEffect(() => {
    // Comments are reserved for members: guests never load the conversation.
    if (!isAuthenticated) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("video_chat_messages")
        .select("id, video_id, user_id, message, created_at")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (!error && data && isMounted) setMessages(data as ChatMessageRow[]);
      if (isMounted) setIsLoading(false);
    };

    load();

    const channel = supabase
      .channel(`video-chat:${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_chat_messages",
          filter: `video_id=eq.${videoId}`,
        },
        (payload) => {
          const next = payload.new as ChatMessageRow;
          setMessages((prev) => [...prev, next]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [videoId, isAuthenticated]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const content = text.trim();
    if (!content || content.length > 280) return;

    setText("");

    const { error } = await supabase.from("video_chat_messages").insert({
      video_id: videoId,
      user_id: user!.id,
      message: content,
    });

    if (error) {
      // restore draft in case of failure
      setText(content);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="space-y-3">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t("video.commentsLocked", "Comments are for members")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("video.commentsLockedDesc", "Create your free account to read and join the conversation.")}
          </p>
          <Button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-primary to-accent"
          >
            {t("video.commentsLockedCta", "Sign in to comment")}
          </Button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message={t("video.commentsLockedCta", "Sign in to comment")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("video.comments", "Comments")}</p>
        <p className="text-[11px] text-muted-foreground">{t("video.charLimit", "up to 280 chars")}</p>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div
          ref={listRef}
          className="h-56 overflow-y-auto p-3 space-y-2"
          role="log"
          aria-label={t("video.comments", "Comments")}
        >
          {isLoading ? (
            <p className="text-xs text-muted-foreground">{t("common.loading", "Loading…")}</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("video.firstComment", "Be the first to comment.")}
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="text-xs">
                <span className="font-medium">
                  <UserHandle userId={m.user_id} showAt />
                </span>
                <span className="text-muted-foreground">: </span>
                <span className="text-foreground/90">{m.message}</span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-2 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("video.commentPlaceholder", "Write something…")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="bg-gradient-to-r from-primary to-accent"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
