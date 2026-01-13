import { createHash } from 'crypto';

export type SectionType = 'thesis' | 'criteria' | 'portfolio' | 'team' | 'general';

export interface SourceLocator {
  url?: string;
  page?: number;
  lineStart?: number;
  lineEnd?: number;
}

export interface Chunk {
  title: string | null;
  content: string;
  sectionType: SectionType;
  sourceLocator: SourceLocator;
  contentHash: string;
}

export interface ChunkTextInput {
  extractedText: string;
  documentType: 'url' | 'pdf' | 'pasted';
  url?: string;
  storageKey?: string;
}

export interface ChunkTextOptions {
  maxChunkSize?: number;
  overlapSize?: number;
}

const DEFAULT_MAX_CHUNK_SIZE = 1500;
const DEFAULT_OVERLAP_SIZE = 200;

/**
 * Keywords that indicate different section types
 */
const SECTION_KEYWORDS: Record<SectionType, string[]> = {
  thesis: [
    'investment thesis',
    'thesis',
    'our approach',
    'investment philosophy',
    'how we invest',
    'what we look for',
    'investment strategy',
  ],
  criteria: [
    'investment criteria',
    'criteria',
    'check size',
    'stage',
    'geography',
    'sector',
    'focus',
    'requirements',
    'what we invest in',
    'sweet spot',
  ],
  portfolio: [
    'portfolio',
    'investments',
    'companies',
    'our companies',
    'selected investments',
    'portfolio companies',
  ],
  team: [
    'team',
    'partners',
    'about us',
    'our team',
    'people',
    'who we are',
    'principals',
  ],
  general: [],
};

/**
 * Detect section type from text content
 */
function detectSectionType(text: string): SectionType {
  const lowerText = text.toLowerCase();

  for (const [sectionType, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (sectionType === 'general') continue;

    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return sectionType as SectionType;
      }
    }
  }

  return 'general';
}

/**
 * Extract heading from text if present
 */
function extractHeading(text: string): { heading: string | null; rest: string } {
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();

  // Check if first line looks like a heading
  // (short, doesn't end with punctuation except colon, less than 100 chars)
  if (
    firstLine &&
    firstLine.length < 100 &&
    !firstLine.match(/[.!?]$/) &&
    !firstLine.match(/^[\d\s]+$/)
  ) {
    return {
      heading: firstLine,
      rest: lines.slice(1).join('\n').trim(),
    };
  }

  return { heading: null, rest: text };
}

/**
 * Hash content for deduplication
 */
function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Split text into chunks using heading-based and size-based approaches
 */
export function chunkText(
  input: ChunkTextInput,
  options: ChunkTextOptions = {}
): Chunk[] {
  const { extractedText, url } = input;
  const maxChunkSize = options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const overlapSize = options.overlapSize ?? DEFAULT_OVERLAP_SIZE;

  if (!extractedText || extractedText.trim().length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  const baseLocator: SourceLocator = {};

  if (url) {
    baseLocator.url = url;
  }

  // Try to split by markdown-style headings first
  const headingPattern = /^#{1,3}\s+(.+)$/gm;
  const sections: { title: string | null; content: string; start: number }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = headingPattern.exec(extractedText)) !== null) {
    if (match.index > lastIndex) {
      const content = extractedText.slice(lastIndex, match.index).trim();
      if (content) {
        const { heading, rest } = extractHeading(content);
        sections.push({
          title: heading,
          content: heading ? rest : content,
          start: lastIndex,
        });
      }
    }
    lastIndex = match.index;
  }

  // Add remaining content
  if (lastIndex < extractedText.length) {
    const content = extractedText.slice(lastIndex).trim();
    if (content) {
      const { heading, rest } = extractHeading(content);
      sections.push({
        title: heading,
        content: heading ? rest : content,
        start: lastIndex,
      });
    }
  }

  // If no sections found, treat entire text as one section
  if (sections.length === 0) {
    sections.push({
      title: null,
      content: extractedText.trim(),
      start: 0,
    });
  }

  // Process each section, splitting if too large
  for (const section of sections) {
    const sectionType = detectSectionType(
      (section.title || '') + ' ' + section.content
    );

    if (section.content.length <= maxChunkSize) {
      // Small enough to be a single chunk
      chunks.push({
        title: section.title,
        content: section.content,
        sectionType,
        sourceLocator: {
          ...baseLocator,
          lineStart: extractedText.slice(0, section.start).split('\n').length,
        },
        contentHash: hashContent(section.content),
      });
    } else {
      // Need to split into smaller chunks with overlap
      let start = 0;
      const content = section.content;
      let isFirstChunk = true;

      while (start < content.length) {
        const end = Math.min(start + maxChunkSize, content.length);
        let chunkContent = content.slice(start, end);

        // Try to break at a natural boundary (sentence or paragraph)
        if (end < content.length) {
          const lastPeriod = chunkContent.lastIndexOf('. ');
          const lastNewline = chunkContent.lastIndexOf('\n');
          const breakPoint = Math.max(lastPeriod, lastNewline);

          if (breakPoint > maxChunkSize * 0.5) {
            chunkContent = chunkContent.slice(0, breakPoint + 1);
          }
        }

        chunks.push({
          title: isFirstChunk ? section.title : null,
          content: chunkContent.trim(),
          sectionType,
          sourceLocator: {
            ...baseLocator,
            lineStart:
              extractedText.slice(0, section.start + start).split('\n').length,
          },
          contentHash: hashContent(chunkContent),
        });

        start += chunkContent.length - overlapSize;
        if (start < 0) start = chunkContent.length;
        isFirstChunk = false;
      }
    }
  }

  return chunks;
}
