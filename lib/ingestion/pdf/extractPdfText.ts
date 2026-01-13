/**
 * PDF text extraction module (stub)
 *
 * This is a placeholder that will be replaced with real PDF extraction
 * using pdfjs or a similar library once storage integration is complete.
 */

export interface PdfExtractionResult {
  text: string;
  meta: {
    pageCount: number;
    storageKey: string;
    stub: boolean;
  };
}

export interface PdfExtractionInput {
  storageKey: string;
}

/**
 * Extract text from a PDF document
 *
 * Currently returns placeholder text. Will be replaced with real extraction.
 */
export async function extractPdfText(
  input: PdfExtractionInput
): Promise<PdfExtractionResult> {
  const { storageKey } = input;

  // TODO: Implement real PDF extraction
  // 1. Download file from storage using storageKey
  // 2. Use pdfjs-dist or similar to extract text
  // 3. Return actual content

  // For now, return a stub response
  const stubText = `[PDF Content Placeholder]

Storage Key: ${storageKey}

This is placeholder text for the PDF document. In a production implementation,
this would be replaced with actual text extracted from the PDF using pdfjs-dist
or a similar library.

The extraction process would:
1. Fetch the PDF bytes from the storage service
2. Parse the PDF structure
3. Extract text from each page
4. Combine and clean the text

Investment Thesis (Example):
We invest in early-stage B2B SaaS companies focused on enterprise productivity.

Check Size: $500K - $2M
Stage: Seed to Series A
Geography: North America, Europe

Focus Areas:
- Developer Tools
- Enterprise SaaS
- AI/ML Applications

This stub text demonstrates the format that would be extracted from an actual
investor pitch deck or profile PDF.`;

  return {
    text: stubText,
    meta: {
      pageCount: 0, // Will be actual page count when implemented
      storageKey,
      stub: true,
    },
  };
}
