import { Page } from "playwright-core";

export interface ExtractedContent {
  mainHeading: string;
  subHeading: string;
  features: string[];
  benefits: string[];
  ctaTexts: string[];
}

/**
 * Extract meaningful content from the page
 * This makes the funnel page less generic and more tailored
 */
export async function extractPageContent(
  page: Page
): Promise<ExtractedContent> {
  try {
    const content = await page.evaluate(() => {
      // Helper to clean text
      function cleanText(text: string): string {
        return text
          .trim()
          .replace(/\s+/g, " ")
          .replace(/[\n\r]+/g, " ")
          .slice(0, 200); // Limit length
      }

      // Extract main heading (h1 or largest text)
      const h1 = document.querySelector("h1");
      const mainHeading = h1
        ? cleanText(h1.textContent || "")
        : document.title;

      // Extract subheading (h2 near h1, or meta description)
      let subHeading = "";
      if (h1) {
        const h2 = h1.parentElement?.querySelector("h2");
        if (h2) {
          subHeading = cleanText(h2.textContent || "");
        }
      }
      if (!subHeading) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          subHeading = metaDesc.getAttribute("content") || "";
        }
      }

      // Extract features (look for lists, h3s, etc.)
      const features: string[] = [];
      const featureSelectors = [
        "ul li",
        ".features li",
        ".feature",
        '[class*="feature"]',
        "h3",
      ];

      for (const selector of featureSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements.slice(0, 6)) {
          // Max 6 features
          const text = cleanText(el.textContent || "");
          if (text.length > 10 && text.length < 150 && !features.includes(text)) {
            features.push(text);
          }
        }
        if (features.length >= 4) break; // Got enough
      }

      // Extract benefits (look for positive keywords)
      const benefits: string[] = [];
      const benefitKeywords = [
        "fast",
        "easy",
        "simple",
        "secure",
        "reliable",
        "powerful",
        "free",
        "unlimited",
        "instant",
      ];

      const paragraphs = Array.from(document.querySelectorAll("p"));
      for (const p of paragraphs) {
        const text = cleanText(p.textContent || "");
        const lowerText = text.toLowerCase();

        // Check if paragraph contains benefit keywords
        if (
          benefitKeywords.some((keyword) => lowerText.includes(keyword)) &&
          text.length > 20 &&
          text.length < 200
        ) {
          benefits.push(text);
          if (benefits.length >= 4) break;
        }
      }

      // Extract CTA texts
      const ctaTexts: string[] = [];
      const ctaSelectors = [
        "button",
        ".btn",
        ".button",
        'a[class*="cta"]',
        'a[class*="button"]',
      ];

      for (const selector of ctaSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const el of elements.slice(0, 5)) {
          const text = cleanText(el.textContent || "");
          if (text.length > 2 && text.length < 30 && !ctaTexts.includes(text)) {
            ctaTexts.push(text);
          }
        }
        if (ctaTexts.length >= 3) break;
      }

      return {
        mainHeading,
        subHeading,
        features,
        benefits,
        ctaTexts,
      };
    });

    console.log(`  Extracted content:`, {
      heading: content.mainHeading.slice(0, 50),
      features: content.features.length,
      benefits: content.benefits.length,
    });

    return content;
  } catch (e) {
    console.error("Content extraction failed:", e);
    return {
      mainHeading: "",
      subHeading: "",
      features: [],
      benefits: [],
      ctaTexts: [],
    };
  }
}
