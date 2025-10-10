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

  // Extract navigation links
  const links = await page.evaluate(() => {
    const navSelectors = [
      "nav a",
      "header a",
      '[role="navigation"] a',
      ".nav a",
      ".navigation a",
      ".menu a",
    ];

    const foundLinks: Array<{ href: string; text: string }> = [];
    const seen = new Set<string>();

    for (const selector of navSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      for (const el of elements) {
        const href = (el as HTMLAnchorElement).href;
        const text =
          (el as HTMLElement).textContent?.trim() || "Untitled Page";

        if (href && !seen.has(href)) {
          seen.add(href);
          foundLinks.push({ href, text });
        }
      }
    }

    return foundLinks;
  });

  // Filter to same domain, unique, and limit
  const seen = new Set<string>();
  for (const link of links) {
    if (pages.length >= maxPages) break;

    try {
      const url = new URL(link.href);

      // Only same domain, no fragments, no duplicates
      if (
        url.hostname === domain &&
        !url.hash &&
        !seen.has(url.pathname) &&
        url.pathname !== "/" // Skip homepage (already added)
      ) {
        seen.add(url.pathname);
        pages.push({
          url: link.href,
          title: link.text.slice(0, 50), // Limit title length
          type: "page",
        });
      }
    } catch {
      // Invalid URL, skip
    }
  }

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
