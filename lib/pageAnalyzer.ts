import { chromium } from 'playwright';

// GitHub API helper functions
async function fetchGitHubRepo(owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FunnelPageBuilder/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('GitHub repo fetch error:', error);
    return null;
  }
}

async function fetchGitHubReadme(owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FunnelPageBuilder/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub README API error: ${response.status}`);
    }
    
    const data = await response.json();
    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    console.error('GitHub README fetch error:', error);
    return null;
  }
}

function extractGitHubFeatures(readmeContent: string): string[] {
  const features: string[] = [];
  
  // Common patterns for features in README files
  const featurePatterns = [
    /## Features?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## What's included\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Key Features?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Highlights?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Capabilities?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
  ];
  
  featurePatterns.forEach(pattern => {
    const matches = readmeContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract bullet points or numbered lists
        const lines = match.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
            const feature = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim();
            if (feature.length > 10 && feature.length < 100) {
              features.push(feature);
            }
          }
        });
      });
    }
  });
  
  return [...new Set(features)];
}

function extractGitHubBenefits(readmeContent: string): string[] {
  const benefits: string[] = [];
  
  // Look for benefits, advantages, why choose sections
  const benefitPatterns = [
    /## Benefits?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Advantages?\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Why choose\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
    /## Why use\s*\n([\s\S]*?)(?=\n##|\n#|\n$)/gi,
  ];
  
  benefitPatterns.forEach(pattern => {
    const matches = readmeContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lines = match.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
            const benefit = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim();
            if (benefit.length > 10 && benefit.length < 100) {
              benefits.push(benefit);
            }
          }
        });
      });
    }
  });
  
  return [...new Set(benefits)];
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Match various GitHub URL patterns
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)(?:\/|$)/,
    /github\.com\/([^\/]+)\/([^\/]+)\.git$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', '')
      };
    }
  }
  
  return null;
}

export interface PageAnalysis {
  title: string;
  description: string;
  headings: string[];
  features: string[];
  benefits: string[];
  ctaTexts: string[];
  keyPhrases: string[];
  content: string;
  images: string[];
  metaKeywords: string[];
  githubRepo?: {
    owner: string;
    repo: string;
    readme: string;
    description: string;
    topics: string[];
    features: string[];
    benefits: string[];
  };
}

export async function analyzePage(url: string): Promise<PageAnalysis> {
  // First, check if this is a GitHub URL and analyze the repository
  const githubInfo = parseGitHubUrl(url);
  let githubRepo = null;
  
  if (githubInfo) {
    console.log(`Detected GitHub repository: ${githubInfo.owner}/${githubInfo.repo}`);
    try {
      const [repoData, readmeContent] = await Promise.all([
        fetchGitHubRepo(githubInfo.owner, githubInfo.repo),
        fetchGitHubReadme(githubInfo.owner, githubInfo.repo)
      ]);
      
      if (repoData && readmeContent) {
        githubRepo = {
          owner: githubInfo.owner,
          repo: githubInfo.repo,
          readme: readmeContent,
          description: repoData.description || '',
          topics: repoData.topics || [],
          features: extractGitHubFeatures(readmeContent),
          benefits: extractGitHubBenefits(readmeContent)
        };
        console.log(`GitHub analysis complete. Found ${githubRepo.features.length} features, ${githubRepo.benefits.length} benefits`);
      }
    } catch (error) {
      console.error('GitHub analysis failed:', error);
    }
  }
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract comprehensive page information
    const analysis = await page.evaluate(() => {
      // Helper function to extract text content
      const getTextContent = (selector: string): string[] => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => el.textContent?.trim() || '').filter(text => text.length > 0);
      };
      
      // Helper function to extract features/benefits from common patterns
      const extractFeatures = (): string[] => {
        const features: string[] = [];
        
        // Look for feature lists, benefit lists, etc.
        const featureSelectors = [
          'li:contains("feature")',
          'li:contains("benefit")',
          'li:contains("advantage")',
          '[class*="feature"] li',
          '[class*="benefit"] li',
          '[class*="advantage"] li',
          '.feature-list li',
          '.benefit-list li',
          '.advantage-list li'
        ];
        
        featureSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && text.length > 10 && text.length < 100) {
                features.push(text);
              }
            });
          } catch (e) {
            // Ignore invalid selectors
          }
        });
        
        return [...new Set(features)]; // Remove duplicates
      };
      
      // Extract CTA texts
      const extractCTAs = (): string[] => {
        const ctaSelectors = [
          'button',
          'a[class*="btn"]',
          'a[class*="button"]',
          'input[type="submit"]',
          '[class*="cta"]',
          '[class*="call-to-action"]'
        ];
        
        const ctas: string[] = [];
        ctaSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 0 && text.length < 50) {
              ctas.push(text);
            }
          });
        });
        
        return [...new Set(ctas)];
      };
      
      // Extract key phrases from headings and important content
      const extractKeyPhrases = (): string[] => {
        const phrases: string[] = [];
        
        // Get headings
        const headings = getTextContent('h1, h2, h3, h4, h5, h6');
        phrases.push(...headings);
        
        // Get strong/emphasized text
        const emphasized = getTextContent('strong, em, b, i, [class*="highlight"]');
        phrases.push(...emphasized);
        
        // Get text from important sections
        const importantSections = getTextContent('[class*="hero"], [class*="banner"], [class*="intro"]');
        phrases.push(...importantSections);
        
        return [...new Set(phrases)].filter(phrase => phrase.length > 5 && phrase.length < 100);
      };
      
      // Extract images
      const extractImages = (): string[] => {
        const images: string[] = [];
        const imgElements = document.querySelectorAll('img');
        imgElements.forEach(img => {
          const src = img.src;
          const alt = img.alt;
          if (src && !src.includes('data:') && !src.includes('placeholder')) {
            images.push(src);
          }
          if (alt && alt.length > 0) {
            images.push(alt);
          }
        });
        return [...new Set(images)];
      };
      
      return {
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        headings: getTextContent('h1, h2, h3, h4, h5, h6'),
        features: extractFeatures(),
        benefits: extractFeatures(), // Same logic for now
        ctaTexts: extractCTAs(),
        keyPhrases: extractKeyPhrases(),
        content: document.body.textContent?.trim() || '',
        images: extractImages(),
        metaKeywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || []
      };
    });
    
    await browser.close();
    
    // Combine website analysis with GitHub analysis
    return {
      ...analysis,
      githubRepo
    };
    
  } catch (error) {
    await browser.close();
    throw new Error(`Failed to analyze page: ${error}`);
  }
}

export function extractRelevantContent(analysis: PageAnalysis): {
  features: string[];
  benefits: string[];
  keyPoints: string[];
} {
  // Prioritize GitHub content if available
  let features: string[] = [];
  let benefits: string[] = [];
  let keyPoints: string[] = [];
  
  if (analysis.githubRepo) {
    // Use GitHub features and benefits first
    features = [
      ...analysis.githubRepo.features,
      ...analysis.features.filter(f => f.length > 10 && f.length < 100)
    ].slice(0, 10);
    
    benefits = [
      ...analysis.githubRepo.benefits,
      ...analysis.benefits.filter(b => b.length > 10 && b.length < 100)
    ].slice(0, 10);
    
    keyPoints = [
      analysis.githubRepo.description,
      ...analysis.githubRepo.topics,
      ...analysis.headings.slice(0, 5),
      ...analysis.keyPhrases.slice(0, 10),
      ...analysis.ctaTexts.slice(0, 5)
    ].filter(point => point && point.length > 5 && point.length < 100);
  } else {
    // Fallback to website content only
    features = analysis.features
      .filter(f => f.length > 10 && f.length < 100)
      .slice(0, 10);
      
    benefits = analysis.benefits
      .filter(b => b.length > 10 && b.length < 100)
      .slice(0, 10);
      
    keyPoints = [
      ...analysis.headings.slice(0, 5),
      ...analysis.keyPhrases.slice(0, 10),
      ...analysis.ctaTexts.slice(0, 5)
    ].filter(point => point.length > 5 && point.length < 100);
  }
  
  return {
    features: [...new Set(features)],
    benefits: [...new Set(benefits)],
    keyPoints: [...new Set(keyPoints)]
  };
}