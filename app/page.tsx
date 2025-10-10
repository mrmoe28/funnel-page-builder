"use client";

import { useState } from "react";
import Preview from "@/components/Preview";

type GenResp = {
  slug: string;
  previewUrl: string;
  meta: any;
  paths: any;
};

export default function Home() {
  const [appName, setAppName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [subhead, setSubhead] = useState("");
  const [primary, setPrimary] = useState("#0ea5e9");
  const [bg, setBg] = useState("#0b1220");
  const [logoUrl, setLogoUrl] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const call = async (url: string, body: any) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(text || "Request failed");
    }
    return r.json();
  };

  const generate = async () => {
    if (!appName || !targetUrl) {
      setMsg("App Name and Target URL are required");
      return;
    }
    setBusy(true);
    setMsg("Generating screenshots & page...");
    try {
      const data: GenResp = await call("/api/generate", {
        appName,
        targetUrl,
        tagline,
        subhead,
        primary,
        bg,
        logoUrl,
      });
      setSlug(data.slug);
      setPreviewUrl(data.previewUrl);
      setMsg("✓ Generated successfully!");
    } catch (e: any) {
      setMsg("Error: " + (e.message || "Failed"));
    } finally {
      setBusy(false);
    }
  };

  const deployGitHub = async () => {
    if (!slug) return;
    setBusy(true);
    setMsg("Deploying to GitHub Pages...");
    try {
      const githubUsername =
        process.env.NEXT_PUBLIC_GITHUB_USERNAME || "";
      if (!githubUsername) {
        setMsg("Error: NEXT_PUBLIC_GITHUB_USERNAME not configured");
        setBusy(false);
        return;
      }
      const data = await call("/api/deploy/github", {
        slug,
        repoName: `funnel-${slug}`,
        githubUsername,
      });
      setMsg(`✓ Published: ${data.url}`);
      window.open(data.url, "_blank");
    } catch (e: any) {
      setMsg("Error: " + (e.message || "GitHub deploy failed"));
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!slug) return;
    setBusy(true);
    setMsg("Preparing ZIP...");
    try {
      const r = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!r.ok) throw new Error("ZIP download failed");
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}.zip`;
      a.click();
      setMsg("✓ ZIP downloaded");
    } catch (e: any) {
      setMsg("Error: " + (e.message || "ZIP failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Funnel Page Builder</h1>
      <p className="mt-2 text-white/70">
        Paste a URL → get a share-ready funnel splash with screenshots & CTA.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 placeholder-white/50"
            placeholder="App Name *"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 placeholder-white/50"
            placeholder="Target URL (https://…) *"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 placeholder-white/50"
            placeholder="Tagline (optional)"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 placeholder-white/50"
            placeholder="Subhead (optional)"
            value={subhead}
            onChange={(e) => setSubhead(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/60">Primary Color</label>
              <input
                type="color"
                className="h-10 w-full rounded-lg"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-white/60">Background</label>
              <input
                type="color"
                className="h-10 w-full rounded-lg"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
              />
            </div>
          </div>
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 placeholder-white/50"
            placeholder="Logo URL (optional)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={generate}
              disabled={busy}
              className="rounded-xl bg-sky-500 px-5 py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              Generate
            </button>
            <button
              onClick={deployGitHub}
              disabled={!slug || busy}
              className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              Deploy to GitHub
            </button>
            <button
              onClick={downloadZip}
              disabled={!slug || busy}
              className="rounded-xl bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-50"
            >
              Download ZIP
            </button>
          </div>
          <p className="text-sm text-white/70">
            {busy ? "⏳ " : ""}
            {msg}
          </p>
        </div>

        <div>
          <Preview href={previewUrl ?? undefined} />
        </div>
      </div>
    </div>
  );
}
