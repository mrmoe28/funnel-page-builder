"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, ExternalLink } from "lucide-react";

export default function Preview({ href }: { href?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.onload = () => {
        // Iframe loaded successfully
        checkNavigation();
      };
    }
  }, [href]);

  const checkNavigation = () => {
    // In an iframe, we can't actually check history, so we'll track it ourselves
    if (ref.current && ref.current.src !== href) {
      setCanGoBack(true);
    }
  };

  const goBack = () => {
    if (ref.current && ref.current.contentWindow) {
      ref.current.contentWindow.history.back();
      setTimeout(() => setCanGoBack(false), 100);
    }
  };

  const reset = () => {
    if (ref.current && href) {
      ref.current.src = href;
      setCanGoBack(false);
    }
  };

  const openInNew = () => {
    if (href) {
      window.open(href, "_blank");
    }
  };

  if (!href) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
      {/* Toolbar */}
      <div className="glass border-b border-border/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3"
            onClick={goBack}
            disabled={!canGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {href}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3"
            onClick={openInNew}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <iframe
        ref={ref}
        src={href}
        className="h-[720px] w-full bg-white"
        title="Funnel Preview"
      />
    </div>
  );
}
