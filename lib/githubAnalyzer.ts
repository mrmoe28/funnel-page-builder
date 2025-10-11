export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  url: string;
}

export interface GitHubAnalysis {
  readme: string;
  description: string;
  topics: string[];
  features: string[];
  benefits: string[];
  keyPhrases: string[];
  installation: string;
  usage: string;
  screenshots: string[];
}

export function extractGitHubInfo(url: string): GitHubRepoInfo | null {
  // Match various GitHub URL patterns
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/,
    /github\.com\/([^\/]+)\/([^\/]+)\.git$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', ''),
        url: `https://github.com/${match[1]}/${match[2].replace('.git', '')}`
      };
    }
  }

  return null;
}

export async function analyzeGitHubRepo(repoInfo: GitHubRepoInfo): Promise<GitHubAnalysis> {
  const { owner, repo } = repoInfo;
  
  try {
    // Fetch repository information
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }
    const repoData = await repoResponse.json();

    // Fetch README content
    let readme = '';
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        // Decode base64 content
        readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.warn('Failed to fetch README:', error);
    }

    // Extract features and benefits from README
    const features = extractFeaturesFromText(readme);
    const benefits = extractBenefitsFromText(readme);
    const keyPhrases = extractKeyPhrasesFromText(readme);
    const installation = extractInstallationFromText(readme);
    const usage = extractUsageFromText(readme);
    const screenshots = extractScreenshotsFromText(readme);

    return {
      readme,
      description: repoData.description || '',
      topics: repoData.topics || [],
      features,
      benefits,
      keyPhrases,
      installation,
      usage,
      screenshots
    };

  } catch (error) {
    throw new Error(`Failed to analyze GitHub repository: ${error}`);
  }
}

function extractFeaturesFromText(text: string): string[] {
  const features: string[] = [];
  
  // Look for feature sections
  const featurePatterns = [
    /## Features?\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
    /### Features?\s*\n([\s\S]*?)(?=\n###|\n##|\n#|$)/gi,
    /Features?\s*:\s*\n([\s\S]*?)(?=\n[A-Z]|\n-|\n\*|$)/gi,
  ];

  featurePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const content = match[1];
      // Extract list items
      const items = content.split('\n')
        .map(line => line.replace(/^[\s\-\*\•]\s*/, '').trim())
        .filter(item => item.length > 5 && item.length < 100);
      features.push(...items);
    }
  });

  // Look for bullet points that might be features
  const bulletPattern = /^[\s\-\*\•]\s*(.+)$/gm;
  const bulletMatches = text.matchAll(bulletPattern);
  for (const match of bulletMatches) {
    const item = match[1].trim();
    if (item.length > 5 && item.length < 100 && 
        (item.toLowerCase().includes('feature') || 
         item.toLowerCase().includes('support') ||
         item.toLowerCase().includes('include'))) {
      features.push(item);
    }
  }

  return [...new Set(features)].slice(0, 10);
}

function extractBenefitsFromText(text: string): string[] {
  const benefits: string[] = [];
  
  // Look for benefit sections
  const benefitPatterns = [
    /## Benefits?\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
    /### Benefits?\s*\n([\s\S]*?)(?=\n###|\n##|\n#|$)/gi,
    /Why\s+.*?\?\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
    /Advantages?\s*:\s*\n([\s\S]*?)(?=\n[A-Z]|\n-|\n\*|$)/gi,
  ];

  benefitPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const content = match[1];
      const items = content.split('\n')
        .map(line => line.replace(/^[\s\-\*\•]\s*/, '').trim())
        .filter(item => item.length > 5 && item.length < 100);
      benefits.push(...items);
    }
  });

  // Look for bullet points that might be benefits
  const bulletPattern = /^[\s\-\*\•]\s*(.+)$/gm;
  const bulletMatches = text.matchAll(bulletPattern);
  for (const match of bulletMatches) {
    const item = match[1].trim();
    if (item.length > 5 && item.length < 100 && 
        (item.toLowerCase().includes('benefit') || 
         item.toLowerCase().includes('advantage') ||
         item.toLowerCase().includes('improve') ||
         item.toLowerCase().includes('enhance'))) {
      benefits.push(item);
    }
  }

  return [...new Set(benefits)].slice(0, 10);
}

function extractKeyPhrasesFromText(text: string): string[] {
  const phrases: string[] = [];
  
  // Extract headings
  const headingPattern = /^#{1,6}\s*(.+)$/gm;
  const headingMatches = text.matchAll(headingPattern);
  for (const match of headingMatches) {
    const heading = match[1].trim();
    if (heading.length > 3 && heading.length < 100) {
      phrases.push(heading);
    }
  }

  // Extract bold/italic text
  const emphasisPattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  const emphasisMatches = text.matchAll(emphasisPattern);
  for (const match of emphasisMatches) {
    const phrase = (match[1] || match[2] || match[3]).trim();
    if (phrase.length > 3 && phrase.length < 100) {
      phrases.push(phrase);
    }
  }

  // Extract code blocks and inline code
  const codePattern = /```[\s\S]*?```|`([^`]+)`/g;
  const codeMatches = text.matchAll(codePattern);
  for (const match of codeMatches) {
    const code = match[1] || match[0];
    if (code && code.length > 3 && code.length < 50) {
      phrases.push(code.trim());
    }
  }

  return [...new Set(phrases)].slice(0, 15);
}

function extractInstallationFromText(text: string): string {
  const installPatterns = [
    /## Installation\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
    /### Installation\s*\n([\s\S]*?)(?=\n###|\n##|\n#|$)/gi,
    /## Getting Started\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
  ];

  for (const pattern of installPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 500); // Limit length
    }
  }

  return '';
}

function extractUsageFromText(text: string): string {
  const usagePatterns = [
    /## Usage\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
    /### Usage\s*\n([\s\S]*?)(?=\n###|\n##|\n#|$)/gi,
    /## Examples?\s*\n([\s\S]*?)(?=\n##|\n#|$)/gi,
  ];

  for (const pattern of usagePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 500); // Limit length
    }
  }

  return '';
}

function extractScreenshotsFromText(text: string): string[] {
  const screenshots: string[] = [];
  
  // Look for image references
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageMatches = text.matchAll(imagePattern);
  
  for (const match of imageMatches) {
    const alt = match[1];
    const url = match[2];
    
    if (alt && alt.toLowerCase().includes('screen')) {
      screenshots.push(alt);
    }
    if (url && (url.includes('screen') || url.includes('demo'))) {
      screenshots.push(url);
    }
  }

  return [...new Set(screenshots)].slice(0, 5);
}

export function combineAnalysis(pageAnalysis: any, githubAnalysis: GitHubAnalysis): {
  features: string[];
  benefits: string[];
  keyPoints: string[];
  description: string;
} {
  // Combine and prioritize content from both sources
  const features = [
    ...githubAnalysis.features,
    ...(pageAnalysis?.features || [])
  ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 10);

  const benefits = [
    ...githubAnalysis.benefits,
    ...(pageAnalysis?.benefits || [])
  ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 10);

  const keyPoints = [
    ...githubAnalysis.keyPhrases,
    ...(pageAnalysis?.keyPhrases || []),
    ...githubAnalysis.topics
  ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 15);

  const description = githubAnalysis.description || pageAnalysis?.description || '';

  return {
    features,
    benefits,
    keyPoints,
    description
  };
}