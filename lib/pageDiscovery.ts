import { Page } from "playwright-core";

export interface DiscoveredPage {
  url: string;
  title: string;
  type: "homepage" | "page";
}

/**
 * Discovers multiple pages from a website
 * Strategy:
 * 1. Try sitemap.xml first
 * 2. Fall back to crawling nav links from homepage
 * 3. Limit to same domain only
 * 4. Return max 5-8 pages to avoid long processing
 */
export async function discoverPages(
  page: Page,
  targetUrl: string,
  maxPages: number = 6
): Promise<DiscoveredPage[]> {
  const baseUrl = new URL(targetUrl);
  const domain = baseUrl.hostname;
  const pages: DiscoveredPage[] = [];

  // Always include the homepage first
  pages.push({
    url: targetUrl,
    title: "Homepage",
    type: "homepage",
  });

  try {
    // Strategy 1: Try sitemap.xml
    const sitemapPages = await tryDiscoverFromSitemap(
      page,
      baseUrl.origin,
      domain,
      maxPages - 1
    );
    if (sitemapPages.length > 0) {
      pages.push(...sitemapPages);
      console.log(
        `✓ Discovered ${sitemapPages.length} pages from sitemap.xml`
      );
      return pages.slice(0, maxPages);
    }
  } catch (e) {
    console.log("Sitemap discovery failed, trying link crawling...");
  }

  try {
    // Strategy 2: Crawl navigation links from homepage
    const crawledPages = await crawlNavigationLinks(
      page,
      domain,
      maxPages - 1
    );
    pages.push(...crawledPages);
    console.log(`✓ Discovered ${crawledPages.length} pages from navigation`);
  } catch (e) {
    console.log("Link crawling failed:", e);
  }

  return pages.slice(0, maxPages);
}

/**
 * Try to discover pages from sitemap.xml
 */
async function tryDiscoverFromSitemap(
  page: Page,
  origin: string,
  domain: string,
  maxPages: number
): Promise<DiscoveredPage[]> {
  const sitemapUrl = `${origin}/sitemap.xml`;
  const pages: DiscoveredPage[] = [];

  try {
    await page.goto(sitemapUrl, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Check if it's actually XML
    const content = await page.content();
    if (!content.includes("<urlset") && !content.includes("<sitemapindex")) {
      throw new Error("Not a valid sitemap");
    }

    // Extract URLs from sitemap
    const urls = await page.evaluate(() => {
      const locElements = Array.from(document.querySelectorAll("loc"));
      return locElements.map((el) => el.textContent?.trim()).filter(Boolean);
    });

    // Filter to same domain and limit
    const filtered = (urls as string[])
      .filter((url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname === domain;
        } catch {
          return false;
        }
      })
      .slice(0, maxPages);

    // Convert to DiscoveredPage format
    for (const url of filtered) {
      const pageName = extractPageName(url);
      pages.push({
        url,
        title: pageName,
        type: "page",
      });
    }
  } catch (e) {
    // Sitemap doesn't exist or can't be parsed
    throw e;
  }

  return pages;
}

/**
 * Crawl navigation links from the current page
 */
async function crawlNavigationLinks(
  page: Page,
  domain: string,
  maxPages: number
): Promise<DiscoveredPage[]> {
  const pages: DiscoveredPage[] = [];

  // Extract ALL links, not just navigation
  const links = await page.evaluate(() => {
    const allLinks: Array<{ href: string; text: string }> = [];
    const seen = new Set<string>();

    // Get ALL links on the page
    const linkElements = Array.from(document.querySelectorAll("a[href]"));

    for (const el of linkElements) {
      const href = (el as HTMLAnchorElement).href;
      const text = (el as HTMLElement).textContent?.trim() || "";

      if (href && !seen.has(href) && text) {
        seen.add(href);
        allLinks.push({ href, text });
      }
    }

    return allLinks;
  });

  // Filter to same domain, unique, and limit
  const seen = new Set<string>();
  const skipKeywords = ["#", "javascript:", "mailto:", "tel:", "login", "signup", "sign-up", "sign-in"];

  for (const link of links) {
    if (pages.length >= maxPages) break;

    try {
      const url = new URL(link.href);

      // Skip certain URLs
      const shouldSkip = skipKeywords.some(keyword =>
        link.href.toLowerCase().includes(keyword)
      );

      // Only same domain, no duplicates, skip homepage
      if (
        url.hostname === domain &&
        !shouldSkip &&
        !seen.has(url.pathname) &&
        url.pathname !== "/" && // Skip homepage
        url.pathname !== "" &&
        link.text.length > 2 // Meaningful text
      ) {
        seen.add(url.pathname);
        pages.push({
          url: link.href.split('#')[0], // Remove fragments
          title: link.text.slice(0, 50),
          type: "page",
        });
      }
    } catch {
      // Invalid URL, skip
    }
  }

  console.log(`  Found ${pages.length} valid links to screenshot`);
  return pages;
}

/**
 * Extract a readable page name from URL
 */
function extractPageName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove leading/trailing slashes
    const cleaned = pathname.replace(/^\/|\/$/g, "");

    if (!cleaned) return "Homepage";

    // Convert to readable format
    return cleaned
      .split("/")
      .pop()
      ?.replace(/-|_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || "Page";
  } catch {
    return "Page";
  }
}
