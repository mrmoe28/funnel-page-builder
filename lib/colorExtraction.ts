import { Page } from "playwright-core";

export interface ExtractedColors {
  primary: string;
  background: string;
  accent?: string;
}

/**
 * Automatically extract brand colors from a website
 * Strategy:
 * 1. Check for primary buttons, CTAs, links
 * 2. Extract logo colors if present
 * 3. Check header/navigation background
 * 4. Fall back to sensible defaults
 */
export async function extractBrandColors(
  page: Page
): Promise<ExtractedColors> {
  try {
    const colors = await page.evaluate(() => {
      // Helper to convert any color to hex
      function rgbToHex(rgb: string): string | null {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return null;

        const [r, g, b] = match.map(Number);
        return (
          "#" +
          [r, g, b]
            .map((x) => {
              const hex = x.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
        );
      }

      function getComputedColor(element: Element): string | null {
        const style = window.getComputedStyle(element);
        const bg = style.backgroundColor;
        const color = style.color;

        // Prefer background color, fall back to text color
        if (
          bg &&
          bg !== "rgba(0, 0, 0, 0)" &&
          bg !== "transparent" &&
          !bg.includes("255, 255, 255")
        ) {
          return rgbToHex(bg);
        }
        if (color && !color.includes("0, 0, 0") && !color.includes("255")) {
          return rgbToHex(color);
        }
        return null;
      }

      const foundColors: string[] = [];

      // Strategy 1: Find primary CTA buttons
      const ctaSelectors = [
        'button[type="submit"]',
        "button.primary",
        "button.cta",
        ".btn-primary",
        ".button-primary",
        'a[class*="cta"]',
        'a[class*="button"]',
        ".primary-button",
      ];

      for (const selector of ctaSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements.slice(0, 3)) {
          const color = getComputedColor(el);
          if (color) foundColors.push(color);
        }
      }

      // Strategy 2: Check navigation/header
      const headerSelectors = ["header", "nav", '[role="banner"]', ".header"];
      for (const selector of headerSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements.slice(0, 2)) {
          const color = getComputedColor(el);
          if (color) foundColors.push(color);
        }
      }

      // Strategy 3: Check logo img
      const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        ".logo img",
      ];
      for (const selector of logoSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const color = getComputedColor(el.parentElement || el);
          if (color) foundColors.push(color);
        }
      }

      // Strategy 4: Check prominent links
      const links = Array.from(document.querySelectorAll("a")).slice(0, 10);
      for (const link of links) {
        const color = getComputedColor(link);
        if (color) foundColors.push(color);
      }

      // Get background color
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const htmlBg = window.getComputedStyle(
        document.documentElement
      ).backgroundColor;

      return {
        foundColors: Array.from(new Set(foundColors)).slice(0, 5), // Unique, max 5
        bodyBg: rgbToHex(bodyBg),
        htmlBg: rgbToHex(htmlBg),
      };
    });

    // Process extracted colors
    let primary = colors.foundColors[0] || "#a855f7"; // Purple default
    let background =
      colors.htmlBg || colors.bodyBg || "#0b1220"; // Dark blue default

    // Ensure primary color is vibrant (not too dark or light)
    if (isDarkColor(primary)) {
      primary = lightenColor(primary, 30);
    }
    if (isLightColor(primary)) {
      primary = darkenColor(primary, 20);
    }

    // Ensure background is dark enough
    if (!isDarkColor(background)) {
      background = "#0b1220"; // Force dark background
    }

    console.log(`✓ Extracted colors: primary=${primary}, bg=${background}`);

    return {
      primary,
      background,
      accent: colors.foundColors[1], // Secondary color if available
    };
  } catch (e) {
    console.error("Color extraction failed:", e);
    // Return sensible defaults
    return {
      primary: "#a855f7",
      background: "#0b1220",
    };
  }
}

// Helper functions for color manipulation
function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return (
    "#" +
    (
      0x1000000 +
      R * 0x10000 +
      G * 0x100 +
      B
    )
      .toString(16)
      .slice(1)
  );
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return (
    "#" +
    (
      0x1000000 +
      R * 0x10000 +
      G * 0x100 +
      B
    )
      .toString(16)
      .slice(1)
  );
}
