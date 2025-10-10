"use client";

import { useEffect, useRef } from "react";

export default function Preview({ href }: { href?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.onload = () => {
        // Iframe loaded successfully
      };
    }
  }, [href]);

  if (!href) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
      <iframe
        ref={ref}
        src={href}
        className="h-[720px] w-full bg-white"
        title="Funnel Preview"
      />
    </div>
  );
}
