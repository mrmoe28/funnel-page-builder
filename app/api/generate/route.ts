import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { slugify } from "@/lib/slug";
import { launchForEnv } from "@/lib/ensureChromium";
import { devices } from "@playwright/test";

async function ensureDir(p: string) {
  await fs.promises.mkdir(p, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const { appName, targetUrl, tagline, subhead, primary, bg, logoUrl } =
      await req.json();

    if (!appName || !targetUrl) {
      return NextResponse.json(
        { error: "appName and targetUrl required" },
        { status: 400 }
      );
    }

    const slug = slugify(appName);
    const base = path.join(process.cwd(), "public", "funnels", slug);
    const assets = path.join(base, "assets");
    await ensureDir(assets);

    const browser = await launchForEnv();

    // Desktop screenshot
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    const desk = path.join(assets, "screenshot-desktop.png");
    await page.screenshot({ path: desk, fullPage: true });

    const title = await page.title();
    const metaDesc = await page
      .locator("meta[name='description']")
      .getAttribute("content")
      .catch(() => null);
    await ctx.close();

    // Mobile screenshot
    const iPhone = devices["iPhone 14 Pro"];
    const mctx = await browser.newContext({ ...iPhone });
    const mpage = await mctx.newPage();
    await mpage.goto(targetUrl, { waitUntil: "networkidle", timeout: 60000 });
    await mpage.waitForTimeout(1200);
    const mob = path.join(assets, "screenshot-mobile.png");
    await mpage.screenshot({ path: mob, fullPage: true });
    await mctx.close();
    await browser.close();

    const primaryCss =
      primary || process.env.NEXT_PUBLIC_DEFAULT_PRIMARY || "#0ea5e9";
    const bgCss = bg || process.env.NEXT_PUBLIC_DEFAULT_BG || "#0b1220";
    const safeTitle = title || appName;
    const safeDesc =
      metaDesc || tagline || "See features at a glance. Try it in seconds.";

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="./assets/screenshot-desktop.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="./assets/screenshot-desktop.png" />
<link rel="canonical" href="./" />
<link rel="icon" href="${logoUrl || "data:,"}">
<script src="https://cdn.tailwindcss.com"></script>
<style>
:root{ --primary:${primaryCss}; --bg:${bgCss}; }
.btn{ background: var(--primary); }
.hero-bg {
  background: radial-gradient(1200px 600px at 20% 10%, rgba(14,165,233,.25), transparent 60%),
              radial-gradient(900px 500px at 80% 20%, rgba(14,165,233,.15), transparent 55%),
              var(--bg);
}
</style>
</head>
<body class="min-h-screen text-white hero-bg">
<header class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
  <div class="text-xl font-bold tracking-wider">${logoUrl ? `<img src="${logoUrl}" class="h-8 w-auto" alt="Logo"/>` : appName}</div>
  <a href="#" id="cta-top" class="btn px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition">Try ${appName}</a>
</header>
<main class="max-w-6xl mx-auto px-6 py-10">
  <section class="grid md:grid-cols-2 gap-10 items-center">
    <div>
      <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">${appName}</h1>
      <p class="mt-4 text-xl text-white/80">${tagline || safeDesc}</p>
      ${subhead ? `<p class="mt-2 text-white/60">${subhead}</p>` : ""}
      <div class="mt-6 flex gap-3">
        <a id="cta-main" href="#" class="btn px-6 py-3 rounded-2xl text-lg font-semibold hover:opacity-90 transition">Open App</a>
        <a href="${targetUrl}" class="px-6 py-3 rounded-2xl border border-white/20 text-lg hover:bg-white/10 transition">Visit Original</a>
      </div>
      <p class="mt-3 text-sm text-white/50">UTM & query params are preserved on click.</p>
    </div>
    <div class="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
      <img src="./assets/screenshot-desktop.png" alt="Screenshot ${appName}" class="w-full h-auto" />
    </div>
  </section>
  <section class="mt-14 grid md:grid-cols-3 gap-6">
    <div class="col-span-1 rounded-xl overflow-hidden ring-1 ring-white/10">
      <img src="./assets/screenshot-mobile.png" alt="Mobile screenshot" class="w-full h-auto" />
    </div>
    <div class="col-span-2 rounded-xl p-6 ring-1 ring-white/10 bg-white/5">
      <h2 class="text-2xl font-bold mb-3">Why this app?</h2>
      <ul class="space-y-2 text-white/80 list-disc pl-5">
        <li>Fast value proposition above the fold</li>
        <li>Clear CTA to the live app</li>
        <li>SEO/OG meta for richer shares</li>
        <li>UTM passthrough for attribution</li>
      </ul>
    </div>
  </section>
</main>
<footer class="max-w-6xl mx-auto px-6 py-10 text-white/50 text-sm">
  © ${new Date().getFullYear()} ${appName}. All rights reserved.
</footer>
<script>
  const CTA_URL = ${JSON.stringify(targetUrl)};
  const params = window.location.search || "";
  const hash = window.location.hash || "";
  const finalUrl = CTA_URL + params + hash;
  for (const id of ["cta-top","cta-main"]) {
    const el = document.getElementById(id);
    if (el) el.href = finalUrl;
  }
</script>
</body>
</html>`;

    await fs.promises.writeFile(path.join(base, "index.html"), html, "utf8");
    const previewUrl = `/funnels/${slug}/index.html`;

    return NextResponse.json({
      slug,
      previewUrl,
      meta: { title: safeTitle, description: safeDesc },
      paths: {
        desktop: `/funnels/${slug}/assets/screenshot-desktop.png`,
        mobile: `/funnels/${slug}/assets/screenshot-mobile.png`,
      },
    });
  } catch (e: any) {
    console.error("Generate error:", e);
    return NextResponse.json(
      { error: e?.message || "generate failed" },
      { status: 500 }
    );
  }
}
