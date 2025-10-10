import { Browser, chromium as pwChromium } from "@playwright/test";
import chromium from "@sparticuz/chromium";
import { chromium as coreChromium } from "playwright-core";

export async function launchForEnv(): Promise<Browser> {
  // Check if running in Vercel serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const executablePath = await chromium.executablePath();
    return (await coreChromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    })) as unknown as Browser;
  }

  // Local development - use regular Playwright
  return await pwChromium.launch({ headless: true });
}
