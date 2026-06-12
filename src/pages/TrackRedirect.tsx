import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId, setAttribution } from "@/lib/tracking";

/**
 * Public tracking redirect: /t/:code
 * Records a click, stores attribution, then forwards to the link destination.
 */
const TrackRedirect = () => {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    let done = false;
    const go = async () => {
      let destination = "/";
      if (code) {
        setAttribution(code.toLowerCase());
        try {
          const { data } = await supabase.functions.invoke("tracker-click", {
            body: {
              code,
              visitor_id: getVisitorId(),
              referrer: document.referrer || null,
            },
          });
          if (data?.destination) destination = data.destination;
        } catch {
          /* ignore */
        }
      }
      if (done) return;
      // keep ?t= attribution available on landing too
      const sep = destination.includes("?") ? "&" : "?";
      const target = code ? `${destination}${sep}t=${encodeURIComponent(code)}` : destination;
      window.location.replace(target);
    };
    go();
    return () => {
      done = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  );
};

export default TrackRedirect;
