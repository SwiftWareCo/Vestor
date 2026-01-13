/**
 * URL text extraction module
 *
 * Fetches HTML from URLs and converts to markdown-like text.
 */

export interface UrlExtractionResult {
  text: string;
  meta: {
    finalUrl: string;
    title: string | null;
    description: string | null;
    truncated: boolean;
    contentLength: number;
  };
}

export interface UrlExtractionOptions {
  maxChars?: number;
  timeoutMs?: number;
}

const DEFAULT_MAX_CHARS = 150_000;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Simple HTML to text conversion
 * Strips tags and normalizes whitespace
 */
function htmlToText(html: string): string {
  // Remove script and style content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Convert common block elements to newlines
  text = text
    .replace(/<\/?(h[1-6]|p|div|br|li|tr|td|th|blockquote|pre|article|section|header|footer|nav|aside)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol|table|thead|tbody)[^>]*>/gi, '\n\n');

  // Extract link text
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, '$2 [$1]');

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) {
    return match[1].trim();
  }

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitle) {
    return ogTitle[1].trim();
  }

  return null;
}

/**
 * Extract description from HTML meta tags
 */
function extractDescription(html: string): string | null {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (match) {
    return match[1].trim();
  }

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDesc) {
    return ogDesc[1].trim();
  }

  return null;
}

/**
 * Fetch and extract text content from a URL
 */
export async function extractUrlText(
  url: string,
  options: UrlExtractionOptions = {}
): Promise<UrlExtractionResult> {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Vestor/1.0 (Investor Profile Bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const title = extractTitle(html);
    const description = extractDescription(html);

    let text = htmlToText(html);
    let truncated = false;

    if (text.length > maxChars) {
      text = text.slice(0, maxChars);
      truncated = true;
    }

    return {
      text,
      meta: {
        finalUrl: response.url,
        title,
        description,
        truncated,
        contentLength: text.length,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    throw error;
  }
}
