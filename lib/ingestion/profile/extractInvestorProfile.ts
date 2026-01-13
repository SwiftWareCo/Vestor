import { z } from 'zod';

/**
 * Schema for extracted investor profile
 */
export const investorProfileSchema = z.object({
  checkSizeMin: z.number().int().positive().nullable(),
  checkSizeMax: z.number().int().positive().nullable(),
  stages: z.array(z.string()),
  geographies: z.array(z.string()),
  focusSectors: z.array(z.string()),
  excludedSectors: z.array(z.string()),
  thesisSummary: z.string().nullable(),
});

export type InvestorProfile = z.infer<typeof investorProfileSchema>;

/**
 * Keywords and patterns for extracting check sizes
 */
function extractCheckSize(text: string): { min: number | null; max: number | null } {
  const lowerText = text.toLowerCase();

  // Pattern for check sizes like "$500K - $2M" or "$1-5M"
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*(?:k|K)\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)\s*(?:m|M)/,
    /\$(\d+(?:\.\d+)?)\s*(?:m|M)\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)\s*(?:m|M)/,
    /check\s*size[:\s]+\$?(\d+(?:\.\d+)?)\s*(?:k|K|m|M)/i,
  ];

  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let min = parseFloat(match[1]);
      let max = match[2] ? parseFloat(match[2]) : min;

      // Convert K to actual value
      if (lowerText.includes('k') || lowerText.includes('K')) {
        min *= 1000;
        if (match[2] && (lowerText.includes('m') || lowerText.includes('M'))) {
          max *= 1000000;
        } else {
          max *= 1000;
        }
      } else if (lowerText.includes('m') || lowerText.includes('M')) {
        min *= 1000000;
        max *= 1000000;
      }

      return { min: Math.round(min), max: Math.round(max) };
    }
  }

  return { min: null, max: null };
}

/**
 * Extract stages from text
 */
function extractStages(text: string): string[] {
  const lowerText = text.toLowerCase();
  const stages: string[] = [];

  const stagePatterns = [
    { pattern: /pre.?seed/i, stage: 'Pre-Seed' },
    { pattern: /\bseed\b/i, stage: 'Seed' },
    { pattern: /series\s*a\b/i, stage: 'Series A' },
    { pattern: /series\s*b\b/i, stage: 'Series B' },
    { pattern: /series\s*c\b/i, stage: 'Series C' },
    { pattern: /growth\s*stage/i, stage: 'Growth' },
    { pattern: /late\s*stage/i, stage: 'Late Stage' },
    { pattern: /early\s*stage/i, stage: 'Early Stage' },
  ];

  for (const { pattern, stage } of stagePatterns) {
    if (pattern.test(lowerText)) {
      stages.push(stage);
    }
  }

  return [...new Set(stages)];
}

/**
 * Extract geographies from text
 */
function extractGeographies(text: string): string[] {
  const lowerText = text.toLowerCase();
  const geos: string[] = [];

  const geoPatterns = [
    { pattern: /\bunited\s*states\b|\bu\.?s\.?\b|\bamerica\b/i, geo: 'United States' },
    { pattern: /\bnorth\s*america\b/i, geo: 'North America' },
    { pattern: /\beurope\b|\beu\b/i, geo: 'Europe' },
    { pattern: /\basia\b|\bapac\b/i, geo: 'Asia' },
    { pattern: /\buk\b|\bunited\s*kingdom\b|\bbritain\b/i, geo: 'United Kingdom' },
    { pattern: /\bglobal\b|\bworldwide\b/i, geo: 'Global' },
    { pattern: /\bcanada\b/i, geo: 'Canada' },
    { pattern: /\blatin\s*america\b|\blatam\b/i, geo: 'Latin America' },
    { pattern: /\bisrael\b/i, geo: 'Israel' },
    { pattern: /\bindia\b/i, geo: 'India' },
  ];

  for (const { pattern, geo } of geoPatterns) {
    if (pattern.test(lowerText)) {
      geos.push(geo);
    }
  }

  return [...new Set(geos)];
}

/**
 * Extract sectors from text
 */
function extractSectors(text: string): { focus: string[]; excluded: string[] } {
  const lowerText = text.toLowerCase();
  const focus: string[] = [];
  const excluded: string[] = [];

  const sectorPatterns = [
    { pattern: /\b(?:artificial\s*intelligence|ai|machine\s*learning|ml)\b/i, sector: 'AI/ML' },
    { pattern: /\bfintech\b|\bfinancial\s*technology\b/i, sector: 'FinTech' },
    { pattern: /\bhealthtech\b|\bhealth\s*tech\b|\bdigital\s*health\b/i, sector: 'HealthTech' },
    { pattern: /\bsaas\b|\bsoftware\s*as\s*a\s*service\b/i, sector: 'SaaS' },
    { pattern: /\be-?commerce\b|\bretail\s*tech\b/i, sector: 'E-commerce' },
    { pattern: /\bedtech\b|\beducation\s*tech\b/i, sector: 'EdTech' },
    { pattern: /\bclean\s*tech\b|\bclimate\s*tech\b|\bsustainability\b/i, sector: 'CleanTech' },
    { pattern: /\bcybersecurity\b|\bsecurity\b/i, sector: 'Cybersecurity' },
    { pattern: /\bdeep\s*tech\b|\bfrontier\b/i, sector: 'DeepTech' },
    { pattern: /\bb2b\b|\benterprise\b/i, sector: 'Enterprise' },
    { pattern: /\bb2c\b|\bconsumer\b/i, sector: 'Consumer' },
    { pattern: /\bmarketplace\b/i, sector: 'Marketplace' },
    { pattern: /\bproptech\b|\breal\s*estate\s*tech\b/i, sector: 'PropTech' },
    { pattern: /\binsurtech\b/i, sector: 'InsurTech' },
    { pattern: /\bhardware\b/i, sector: 'Hardware' },
    { pattern: /\bbiotech\b|\blife\s*sciences\b/i, sector: 'Biotech' },
    { pattern: /\bcrypto\b|\bblockchain\b|\bweb3\b/i, sector: 'Crypto/Web3' },
  ];

  // Check for exclusion patterns
  const exclusionPatterns = /(?:we\s*do\s*not|don't|doesn't|avoid|no\s*interest\s*in|not\s*investing\s*in|excluded?)/i;

  for (const { pattern, sector } of sectorPatterns) {
    if (pattern.test(lowerText)) {
      // Check if this sector appears in an exclusion context
      const sectorMatch = lowerText.match(pattern);
      if (sectorMatch) {
        const context = lowerText.slice(
          Math.max(0, sectorMatch.index! - 50),
          sectorMatch.index! + 50
        );

        if (exclusionPatterns.test(context)) {
          excluded.push(sector);
        } else {
          focus.push(sector);
        }
      }
    }
  }

  return {
    focus: [...new Set(focus)],
    excluded: [...new Set(excluded)],
  };
}

/**
 * Extract thesis summary (first meaningful paragraph about investment approach)
 */
function extractThesisSummary(text: string): string | null {
  const paragraphs = text.split(/\n\n+/);

  const thesisKeywords = [
    'invest',
    'thesis',
    'approach',
    'focus',
    'partner',
    'back',
    'support',
    'look for',
    'believe',
    'seek',
  ];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length < 50 || trimmed.length > 1000) continue;

    const lowerPara = trimmed.toLowerCase();
    const hasThesisKeyword = thesisKeywords.some((kw) => lowerPara.includes(kw));

    if (hasThesisKeyword) {
      return trimmed;
    }
  }

  // Fallback: return first substantial paragraph
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length >= 100 && trimmed.length <= 500) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Extract structured investor profile from corpus text
 *
 * TODO: Replace with LLM-based extraction for better accuracy
 */
export function extractInvestorProfile(corpusText: string): InvestorProfile {
  const { min, max } = extractCheckSize(corpusText);
  const stages = extractStages(corpusText);
  const geographies = extractGeographies(corpusText);
  const { focus, excluded } = extractSectors(corpusText);
  const thesisSummary = extractThesisSummary(corpusText);

  return {
    checkSizeMin: min,
    checkSizeMax: max,
    stages,
    geographies,
    focusSectors: focus,
    excludedSectors: excluded,
    thesisSummary,
  };
}
