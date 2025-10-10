"use client";

import { useState } from "react";
import Preview from "@/components/Preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Github, Download, Loader2, Link2, Wand2 } from "lucide-react";

type GenResp = {
  slug: string;
  previewUrl: string;
  meta: any;
  paths: any;
};

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [tagline, setTagline] = useState("");
  const [subhead, setSubhead] = useState("");
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
    if (!targetUrl || !appName) {
      setMsg("URL and App Name are required");
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
      const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "";
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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Wand2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Create Your Funnel Page
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Paste any URL and we'll automatically generate a beautiful, conversion-optimized splash page with screenshots
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Your URL</CardTitle>
            <CardDescription>
              Start by entering the URL you want to create a funnel page for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PRIMARY: URL Input - Most Important */}
            <div className="space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Label htmlFor="targetUrl" className="text-base font-semibold">
                <Link2 className="mr-2 inline h-5 w-5" />
                Website URL *
              </Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                We'll capture screenshots and extract details from this URL
              </p>
            </div>

            {/* SECONDARY: App Name */}
            <div className="space-y-2">
              <Label htmlFor="appName" className="text-base font-semibold">
                App Name *
              </Label>
              <Input
                id="appName"
                placeholder="My Awesome App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Optional Customization
                </span>
              </div>
            </div>

            {/* Optional Fields - Collapsed by default feel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="The fastest way to get things done"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subhead">Subheading</Label>
                <Input
                  id="subhead"
                  placeholder="See features at a glance"
                  value={subhead}
                  onChange={(e) => setSubhead(e.target.value)}
                />
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  🎨 <strong>Colors auto-detected!</strong> We'll extract your brand's primary color and background from the website automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.svg"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={generate}
                disabled={busy || !targetUrl || !appName}
                className="h-12 w-full text-base"
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Funnel Page
                  </>
                )}
              </Button>

              {slug && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={deployGitHub}
                    disabled={busy}
                    variant="secondary"
                    size="lg"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Deploy
                  </Button>

                  <Button
                    onClick={downloadZip}
                    disabled={busy}
                    variant="outline"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}

              {msg && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    msg.startsWith("Error")
                      ? "border-destructive/50 bg-destructive/10 text-destructive"
                      : "border-primary/50 bg-primary/10 text-primary"
                  }`}
                >
                  {msg}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              {previewUrl
                ? "Your generated funnel page"
                : "Enter a URL to see the magic"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <Preview href={previewUrl} />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center space-y-4 p-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Link2 className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Ready to create?</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Paste your website URL above and we'll generate a stunning funnel page with automated screenshots
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
