import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { slugify } from "@/lib/slug";
import { launchForEnv } from "@/lib/ensureChromium";
import { devices } from "@playwright/test";
import { discoverPages, type DiscoveredPage } from "@/lib/pageDiscovery";
import { extractBrandColors } from "@/lib/colorExtraction";
import { extractPageContent } from "@/lib/contentExtraction";

async function ensureDir(p: string) {
  await fs.promises.mkdir(p, { recursive: true });
}

interface PageScreenshot {
  url: string;
  title: string;
  desktopPath: string;
  mobilePath: string;
}

export async function POST(req: NextRequest) {
  try {
    const { appName, targetUrl, tagline, subhead, logoUrl, uploadedImages = [] } =
      await req.json();

    if (!appName || !targetUrl) {
      return NextResponse.json(
        { error: "appName and targetUrl required" },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting funnel generation for: ${targetUrl}`);
    if (uploadedImages.length > 0) {
      console.log(`📤 ${uploadedImages.length} custom images uploaded`);
    }

    const slug = slugify(appName);
    const base = path.join(process.cwd(), "public", "funnels", slug);
    const assets = path.join(base, "assets");
    await ensureDir(assets);

    const browser = await launchForEnv();
    const screenshots: PageScreenshot[] = [];

    // Step 1: Open homepage and discover pages
    console.log("📄 Discovering pages...");
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);

    // Extract metadata from homepage
    const title = await page.title();
    const metaDesc = await page
      .locator("meta[name='description']")
      .getAttribute("content")
      .catch(() => null);

    // Step 2: Auto-extract brand colors
    console.log("🎨 Extracting brand colors...");
    const colors = await extractBrandColors(page);
    const primaryCss = colors.primary;
    const bgCss = colors.background;
    console.log(`  Primary: ${primaryCss}, Background: ${bgCss}`);

    // Step 2.5: Extract page content
    console.log("📝 Extracting page content...");
    const content = await extractPageContent(page);

    // Use extracted content or fall back to user input
    const finalTagline = tagline || content.subHeading || safeDesc;
    const finalSubhead = subhead || content.benefits[0] || "";

    // Combine features and benefits for "Why Choose" section
    const whyChooseItems = [
      ...content.features.slice(0, 3),
      ...content.benefits.slice(0, 3),
    ].slice(0, 4); // Take up to 4 items total

    console.log(`  Extracted ${whyChooseItems.length} features/benefits for "Why Choose" section`);

    // Step 3: Discover additional pages
    const discoveredPages = await discoverPages(page, targetUrl, 6);
    console.log(`  Found ${discoveredPages.length} pages to screenshot`);

    // Step 4: Screenshot all discovered pages
    for (let i = 0; i < discoveredPages.length; i++) {
      const discoveredPage = discoveredPages[i];
      console.log(`📸 ${i + 1}/${discoveredPages.length}: ${discoveredPage.title}`);

      try {
        // Navigate to page if not homepage
        if (i > 0) {
          await page.goto(discoveredPage.url, {
            waitUntil: "networkidle",
            timeout: 30000,
          });
          await page.waitForTimeout(1200);
        }

        // Desktop screenshot
        const deskPath = path.join(assets, `page-${i}-desktop.png`);
        await page.screenshot({ path: deskPath, fullPage: true });

        // Mobile screenshot
        const iPhone = devices["iPhone 14 Pro"];
        const mctx = await browser.newContext({ ...iPhone });
        const mpage = await mctx.newPage();
        await mpage.goto(discoveredPage.url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        await mpage.waitForTimeout(1200);
        const mobPath = path.join(assets, `page-${i}-mobile.png`);
        await mpage.screenshot({ path: mobPath, fullPage: true });
        await mctx.close();

        screenshots.push({
          url: discoveredPage.url,
          title: discoveredPage.title,
          desktopPath: `/funnels/${slug}/assets/page-${i}-desktop.png`,
          mobilePath: `/funnels/${slug}/assets/page-${i}-mobile.png`,
        });
      } catch (e) {
        console.error(`  ⚠️ Failed to screenshot ${discoveredPage.title}:`, e);
      }
    }

    await ctx.close();
    await browser.close();

    console.log(`✅ Captured ${screenshots.length} pages`);

    // Save uploaded images
    const uploadedImagePaths: string[] = [];
    if (uploadedImages && uploadedImages.length > 0) {
      console.log("💾 Saving uploaded images...");
      for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        const base64Data = image.data.split(",")[1]; // Remove data:image/png;base64, prefix
        const buffer = Buffer.from(base64Data, "base64");
        const ext = image.type.split("/")[1] || "png";
        const filename = `uploaded-${i}.${ext}`;
        const filepath = path.join(assets, filename);
        await fs.promises.writeFile(filepath, buffer);
        uploadedImagePaths.push(`/funnels/${slug}/assets/${filename}`);
      }
      console.log(`  Saved ${uploadedImagePaths.length} uploaded images`);
    }

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
:root{
  --primary: ${primaryCss};
  --bg: ${bgCss};
}

/* Animated Gradient Background */
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animated-gradient-bg {
  background:
    radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, ${bgCss} 0%, ${bgCss} 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}

/* Primary CTA Button with Micro-interactions */
.primary-cta {
  background: linear-gradient(135deg, ${primaryCss} 0%, ${primaryCss} 100%);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
}

.primary-cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.primary-cta:hover::before {
  left: 100%;
}

.primary-cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 25px rgba(168, 85, 247, 0.6);
}

.primary-cta:active {
  transform: translateY(0) scale(0.98);
}

/* Secondary CTA */
.secondary-cta {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.secondary-cta:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* Scroll Animation Classes */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-in {
  opacity: 0;
  transition: opacity 0.8s ease;
}

.fade-in.visible {
  opacity: 1;
}

.scale-in {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.scale-in.visible {
  opacity: 1;
  transform: scale(1);
}

/* Floating Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.float {
  animation: float 6s ease-in-out infinite;
}

/* Pulse Glow */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
  50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
}

.pulse-glow {
  animation: pulseGlow 3s ease-in-out infinite;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .fade-in-up {
    transform: translateY(20px);
  }
}
</style>
</head>
<body class="min-h-screen text-white animated-gradient-bg">

<!-- Header with Glassmorphism -->
<header class="sticky top-0 z-50 glass">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div class="text-xl font-bold tracking-wider fade-in visible">
      ${logoUrl ? `<img src="${logoUrl}" class="h-8 w-auto" alt="Logo"/>` : appName}
    </div>
    <a href="#" id="cta-top" class="primary-cta px-5 py-2.5 rounded-xl font-semibold text-white text-sm">
      Try ${appName} Free
    </a>
  </div>
</header>

<!-- Hero Section -->
<main class="max-w-6xl mx-auto px-6 py-16 md:py-24">
  <section class="grid md:grid-cols-2 gap-12 items-center">
    <!-- Left: Content -->
    <div class="space-y-6">
      <div class="inline-block px-4 py-2 glass rounded-full text-sm font-medium fade-in-up">
        ✨ New & Trending
      </div>

      <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight fade-in-up" style="transition-delay: 0.1s;">
        ${appName}
      </h1>

      <p class="text-xl md:text-2xl text-white/90 leading-relaxed fade-in-up" style="transition-delay: 0.2s;">
        ${finalTagline}
      </p>

      ${finalSubhead ? `<p class="text-lg text-white/70 fade-in-up" style="transition-delay: 0.3s;">${finalSubhead}</p>` : ""}

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 pt-4 fade-in-up" style="transition-delay: 0.4s;">
        <a id="cta-main" href="#" class="primary-cta px-8 py-4 rounded-2xl text-lg font-bold text-white text-center pulse-glow">
          🚀 Get Started Now
        </a>
        <a href="${targetUrl}" class="secondary-cta px-8 py-4 rounded-2xl text-lg font-semibold text-center">
          View Demo
        </a>
      </div>

      <p class="text-sm text-white/50 fade-in-up" style="transition-delay: 0.5s;">
        ⚡ No credit card required • ✅ Free forever plan
      </p>
    </div>

    <!-- Right: Homepage Screenshot with Floating Animation -->
    <div class="fade-in-up float" style="transition-delay: 0.3s;">
      <div class="glass-strong rounded-3xl overflow-hidden shadow-2xl">
        <img src="${screenshots[0]?.desktopPath || './assets/page-0-desktop.png'}" alt="${appName} Homepage" class="w-full h-auto" />
      </div>
      <p class="text-center text-sm text-white/60 mt-3">Homepage Preview</p>
    </div>
  </section>

  ${
    screenshots.length > 1 || uploadedImagePaths.length > 0
      ? `
  <!-- Gallery Section: Additional Pages + Uploaded Images -->
  <section class="mt-16">
    <h2 class="text-3xl font-bold mb-8 text-center fade-in-up">
      ${screenshots.length > 1 ? "More from" : "Featured Images for"} ${appName}
    </h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${
        // First show additional scraped pages (skip homepage)
        screenshots
          .slice(1)
          .map(
            (screenshot, idx) => `
        <div class="scale-in" style="transition-delay: ${(idx + 1) * 0.1}s;">
          <div class="glass rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <img src="${screenshot.desktopPath}" alt="${screenshot.title}" class="w-full h-auto" />
            <div class="p-4">
              <p class="text-sm font-semibold text-white/90">${screenshot.title}</p>
            </div>
          </div>
        </div>
      `
          )
          .join("")
      }
      ${
        // Then show uploaded images
        uploadedImagePaths
          .map(
            (imagePath, idx) => `
        <div class="scale-in" style="transition-delay: ${(screenshots.length + idx) * 0.1}s;">
          <div class="glass rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <img src="${imagePath}" alt="Featured Image ${idx + 1}" class="w-full h-auto" />
            <div class="p-4">
              <p class="text-sm font-semibold text-white/90">Custom Image ${idx + 1}</p>
            </div>
          </div>
        </div>
      `
          )
          .join("")
      }
    </div>
  </section>
  `
      : ""
  }

  <!-- Mobile Screenshots Section -->
  <section class="mt-24 md:mt-32 grid md:grid-cols-3 gap-8">
    <!-- Homepage Mobile Screenshot -->
    <div class="scale-in">
      <div class="glass rounded-2xl overflow-hidden shadow-xl">
        <img src="${screenshots[0]?.mobilePath || './assets/page-0-mobile.png'}" alt="${appName} Mobile" class="w-full h-auto mx-auto" style="max-width: 300px;" />
      </div>
      <p class="text-center text-sm text-white/60 mt-2">Mobile View</p>
    </div>

    <!-- Features List -->
    <div class="col-span-2 space-y-6 scale-in" style="transition-delay: 0.2s;">
      <div class="glass-strong rounded-2xl p-8">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Why Choose ${appName}?
        </h2>
        <div class="space-y-4">
          ${
            whyChooseItems.length > 0
              ? whyChooseItems
                  .map(
                    (item, idx) => {
                      // Define gradient colors and icons for each item
                      const gradients = [
                        "from-purple-500 to-pink-500",
                        "from-blue-500 to-cyan-500",
                        "from-green-500 to-emerald-500",
                        "from-orange-500 to-red-500",
                      ];
                      const icons = ["✓", "⚡", "🎯", "📱"];

                      return `
          <div class="flex items-start gap-4 group">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[idx % 4]} flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              ${icons[idx % 4]}
            </div>
            <div>
              <p class="text-white/90 text-base leading-relaxed">${item}</p>
            </div>
          </div>
                      `;
                    }
                  )
                  .join("")
              : `
          <!-- Fallback: Generic features if extraction failed -->
          <div class="flex items-start gap-4 group">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              ✓
            </div>
            <div>
              <h3 class="font-semibold text-lg">Instant Value</h3>
              <p class="text-white/70">Get started in seconds with our intuitive interface</p>
            </div>
          </div>

          <div class="flex items-start gap-4 group">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div>
              <h3 class="font-semibold text-lg">Lightning Fast</h3>
              <p class="text-white/70">Optimized for speed and performance</p>
            </div>
          </div>

          <div class="flex items-start gap-4 group">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              🎯
            </div>
            <div>
              <h3 class="font-semibold text-lg">Mobile Ready</h3>
              <p class="text-white/70">Looks perfect on every device</p>
            </div>
          </div>
              `
          }
        </div>
      </div>

      <!-- Final CTA -->
      <div class="glass-strong rounded-2xl p-8 text-center">
        <h3 class="text-2xl font-bold mb-4">Ready to get started?</h3>
        <p class="text-white/80 mb-6">Join thousands of users already using ${appName}</p>
        <a href="#" class="cta-final primary-cta inline-block px-10 py-4 rounded-2xl text-lg font-bold text-white">
          Start Free Trial →
        </a>
      </div>
    </div>
  </section>
</main>

<!-- Footer -->
<footer class="max-w-6xl mx-auto px-6 py-12 mt-24">
  <div class="glass rounded-2xl p-8 text-center text-white/60 text-sm">
    © ${new Date().getFullYear()} ${appName}. All rights reserved.
  </div>
</footer>

<!-- Scripts -->
<script>
  // UTM Parameter Preservation
  const CTA_URL = ${JSON.stringify(targetUrl)};
  const params = window.location.search || "";
  const hash = window.location.hash || "";
  const finalUrl = CTA_URL + params + hash;

  const ctaElements = ["cta-top", "cta-main"];
  const ctaFinal = document.querySelector(".cta-final");

  ctaElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = finalUrl;
  });

  if (ctaFinal) ctaFinal.href = finalUrl;

  // Scroll-Triggered Animations (Intersection Observer)
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document.querySelectorAll('.fade-in-up, .fade-in, .scale-in').forEach(el => {
    observer.observe(el);
  });

  // Add visible class to header immediately
  document.querySelectorAll('header .fade-in').forEach(el => {
    el.classList.add('visible');
  });
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
