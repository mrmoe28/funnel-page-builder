import { NextRequest, NextResponse } from "next/server";
import { analyzePage, extractRelevantContent } from "@/lib/pageAnalyzer";
import { extractGitHubInfo, analyzeGitHubRepo, combineAnalysis } from "@/lib/githubAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const { appName, targetUrl, tagline, subhead } = await req.json();

    if (!appName || !targetUrl) {
      return NextResponse.json(
        { error: "appName and targetUrl are required" },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    // Analyze the target URL and GitHub repository
    let pageAnalysis = null;
    let extractedContent = null;
    let githubAnalysis = null;
    let combinedContent = null;
    
    try {
      console.log(`Analyzing page: ${targetUrl}`);
      pageAnalysis = await analyzePage(targetUrl);
      extractedContent = extractRelevantContent(pageAnalysis);
      console.log(`Page analysis complete. Found ${extractedContent.features.length} features, ${extractedContent.benefits.length} benefits`);
      
      // Check if this is a GitHub repository
      const githubInfo = extractGitHubInfo(targetUrl);
      if (githubInfo) {
        console.log(`GitHub repository detected: ${githubInfo.owner}/${githubInfo.repo}`);
        try {
          githubAnalysis = await analyzeGitHubRepo(githubInfo);
          console.log(`GitHub analysis complete. Found ${githubAnalysis.features.length} features, ${githubAnalysis.benefits.length} benefits`);
          
          // Combine both analyses
          combinedContent = combineAnalysis(extractedContent, githubAnalysis);
          console.log(`Combined analysis: ${combinedContent.features.length} features, ${combinedContent.benefits.length} benefits`);
        } catch (githubError) {
          console.error("GitHub analysis failed:", githubError);
          // Continue with page analysis only
        }
      }
    } catch (error) {
      console.error("Page analysis failed:", error);
      // Continue with fallback if page analysis fails
    }

    if (!openaiKey) {
      // If no OpenAI key, return content based on combined analysis or fallback
      const contentToUse = combinedContent || extractedContent;
      if (contentToUse && contentToUse.features.length > 0) {
        const items = [
          ...contentToUse.features.slice(0, 2),
          ...contentToUse.benefits.slice(0, 2)
        ].slice(0, 4);
        
        // Ensure we have 4 items
        while (items.length < 4) {
          items.push(`Experience ${appName} like never before`);
        }
        
        return NextResponse.json({ items: items.slice(0, 4) });
      }
      
      // Fallback response
      return NextResponse.json({
        items: [
          `Get started with ${appName} in seconds`,
          "Lightning-fast performance and reliability",
          "Intuitive interface designed for ease of use",
          "Works seamlessly across all devices",
        ],
      });
    }

    // Create enhanced prompt with analyzed content
    let contentContext = "";
    const contentToUse = combinedContent || extractedContent;
    
    if (pageAnalysis && contentToUse) {
      contentContext = `

WEBSITE ANALYSIS:
- Title: ${pageAnalysis.title}
- Description: ${pageAnalysis.description}
- Key Features Found: ${contentToUse.features.slice(0, 5).join(", ")}
- Key Benefits Found: ${contentToUse.benefits.slice(0, 5).join(", ")}
- Important Headings: ${pageAnalysis.headings.slice(0, 3).join(", ")}
- Call-to-Action Texts: ${pageAnalysis.ctaTexts.slice(0, 3).join(", ")}`;

      // Add GitHub repository information if available
      if (githubAnalysis) {
        contentContext += `

GITHUB REPOSITORY ANALYSIS:
- Repository: ${githubAnalysis.description}
- Repository Topics: ${githubAnalysis.topics.join(", ")}
- README Features: ${githubAnalysis.features.slice(0, 5).join(", ")}
- README Benefits: ${githubAnalysis.benefits.slice(0, 5).join(", ")}
- Key Phrases: ${githubAnalysis.keyPhrases.slice(0, 5).join(", ")}`;
      }
    }

    const prompt = `Generate 4 compelling "Why Choose" benefits/features for a product/service called "${appName}"${targetUrl ? ` (website: ${targetUrl})` : ""}${tagline ? ` with tagline: "${tagline}"` : ""}${subhead ? ` and subheading: "${subhead}"` : ""}.${contentContext}

Based on the analysis above, create benefits that:
- Are specific to the actual product/service features found on the website${githubAnalysis ? ' and GitHub repository' : ''}
- Use the real language and terminology from the website${githubAnalysis ? ' and README documentation' : ''}
- Highlight the most compelling features and benefits discovered
- Are concise (max 10 words each)
- Start with strong action verbs or benefit statements
${githubAnalysis ? '- Prioritize GitHub repository features and benefits when available' : ''}

Return ONLY 4 items, one per line, no numbering or bullet points.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a marketing copywriter expert at creating compelling product benefits.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      // Return fallback based on combined analyzed content or generic fallback
      const contentToUse = combinedContent || extractedContent;
      if (contentToUse && contentToUse.features.length > 0) {
        const items = [
          ...contentToUse.features.slice(0, 2),
          ...contentToUse.benefits.slice(0, 2)
        ].slice(0, 4);
        
        // Ensure we have 4 items
        while (items.length < 4) {
          items.push(`Experience ${appName} like never before`);
        }
        
        return NextResponse.json({ items: items.slice(0, 4) });
      }
      
      // Generic fallback
      return NextResponse.json({
        items: [
          `Experience ${appName} like never before`,
          "Built for speed, designed for simplicity",
          "Trusted by thousands of users worldwide",
          "Start free, upgrade as you grow",
        ],
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const items = content
      .split("\n")
      .filter((line: string) => line.trim())
      .slice(0, 4);

    // Ensure we have exactly 4 items
    while (items.length < 4) {
      items.push("");
    }

    return NextResponse.json({ items: items.slice(0, 4) });
  } catch (error: any) {
    console.error("Generate why-choose error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}