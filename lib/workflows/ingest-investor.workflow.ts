import { db } from '@/lib/db';
import {
  investors,
  documents,
  ingestionRuns,
  investorSections,
  type StepState,
} from '@/lib/database';
import { eq } from 'drizzle-orm';
import { extractUrlText } from '@/lib/ingestion/url/extractUrlText';
import { extractPdfText } from '@/lib/ingestion/pdf/extractPdfText';
import { chunkText } from '@/lib/ingestion/chunking/chunkText';
import { extractInvestorProfile } from '@/lib/ingestion/profile/extractInvestorProfile';
import {
  embedText,
  embedTexts,
  getEmbeddingModel,
  getEmbeddingDimensions,
} from '@/lib/ingestion/embeddings/embedTexts';
import { computeCoverage, needsReview } from '@/lib/ingestion/coverage/computeCoverage';

export interface WorkflowContext {
  runId: string;
  investorId: string;
  userId: string;
}

export interface WorkflowStep {
  name: string;
  execute: (ctx: WorkflowContext) => Promise<void>;
}

/**
 * Update the step state in the database
 */
async function updateStepState(runId: string, updates: Partial<StepState>) {
  const [run] = await db
    .select()
    .from(ingestionRuns)
    .where(eq(ingestionRuns.id, runId));

  if (!run) return;

  const currentState = (run.stepState as StepState) || {};
  const newState: StepState = {
    ...currentState,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  await db
    .update(ingestionRuns)
    .set({ stepState: newState })
    .where(eq(ingestionRuns.id, runId));
}

/**
 * Step: Load investor and documents
 */
async function stepLoad(ctx: WorkflowContext): Promise<void> {
  const [investor] = await db
    .select()
    .from(investors)
    .where(eq(investors.id, ctx.investorId));

  if (!investor) {
    throw new Error('Investor not found');
  }

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  await updateStepState(ctx.runId, {
    currentStep: 'load',
    documentCounts: {
      total: docs.length,
      processed: 0,
      failed: 0,
    },
  });
}

/**
 * Step: Mark documents as processing
 */
async function stepMarkDocumentsProcessing(ctx: WorkflowContext): Promise<void> {
  await db
    .update(documents)
    .set({
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(documents.investorId, ctx.investorId));

  await updateStepState(ctx.runId, {
    currentStep: 'mark-documents-processing',
  });
}

/**
 * Step: Extract text from URL documents
 */
async function stepExtractUrls(ctx: WorkflowContext): Promise<void> {
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  const urlDocs = docs.filter((d) => d.type === 'url');
  let processed = 0;
  let failed = 0;

  for (const doc of urlDocs) {
    try {
      if (!doc.url) {
        throw new Error('URL document missing URL');
      }

      const result = await extractUrlText(doc.url, {
        maxChars: 150_000,
        timeoutMs: 30_000,
      });

      await db
        .update(documents)
        .set({
          extractedText: result.text,
          metaJson: {
            ...result.meta,
            extractedAt: new Date().toISOString(),
            source: 'url',
          },
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));

      processed++;
    } catch (error) {
      failed++;
      await db
        .update(documents)
        .set({
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));
    }

    await updateStepState(ctx.runId, {
      currentStep: 'extract-urls',
      documentCounts: {
        total: docs.length,
        processed,
        failed,
      },
    });
  }
}

/**
 * Step: Extract text from PDF documents
 */
async function stepExtractPdfs(ctx: WorkflowContext): Promise<void> {
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  const pdfDocs = docs.filter((d) => d.type === 'pdf');
  const urlDocs = docs.filter((d) => d.type === 'url');
  let processed = urlDocs.length;
  let failed = 0;

  for (const doc of pdfDocs) {
    try {
      if (!doc.storageKey) {
        throw new Error('PDF document missing storage key');
      }

      const result = await extractPdfText({ storageKey: doc.storageKey });

      await db
        .update(documents)
        .set({
          extractedText: result.text,
          metaJson: {
            ...result.meta,
            extractedAt: new Date().toISOString(),
            source: 'pdf',
          },
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));

      processed++;
    } catch (error) {
      failed++;
      await db
        .update(documents)
        .set({
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));
    }

    await updateStepState(ctx.runId, {
      currentStep: 'extract-pdfs',
      documentCounts: {
        total: docs.length,
        processed,
        failed,
      },
    });
  }
}

/**
 * Step: Mark documents as ready or failed
 */
async function stepMarkDocumentsReady(ctx: WorkflowContext): Promise<void> {
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  for (const doc of docs) {
    if (doc.error) {
      await db
        .update(documents)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));
    } else if (doc.extractedText) {
      await db
        .update(documents)
        .set({
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id));
    }
  }

  await updateStepState(ctx.runId, {
    currentStep: 'mark-documents-ready',
  });
}

/**
 * Step: Chunk documents and create investor_sections
 */
async function stepChunkDocuments(ctx: WorkflowContext): Promise<void> {
  // Delete existing sections for idempotency
  await db
    .delete(investorSections)
    .where(eq(investorSections.investorId, ctx.investorId));

  // Get all ready documents
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  const readyDocs = docs.filter((d) => d.status === 'ready' && d.extractedText);

  for (const doc of readyDocs) {
    const chunks = chunkText({
      extractedText: doc.extractedText!,
      documentType: doc.type,
      url: doc.url ?? undefined,
      storageKey: doc.storageKey ?? undefined,
    });

    // Insert sections for this document
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await db.insert(investorSections).values({
        investorId: ctx.investorId,
        documentId: doc.id,
        sectionType: chunk.sectionType,
        title: chunk.title,
        content: chunk.content,
        contentHash: chunk.contentHash,
        chunkIndex: i,
        sourceLocator: chunk.sourceLocator,
      });
    }
  }

  await updateStepState(ctx.runId, {
    currentStep: 'chunk-documents',
  });
}

/**
 * Step: Extract investor profile from corpus
 */
async function stepExtractProfile(ctx: WorkflowContext): Promise<void> {
  // Get all ready documents
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, ctx.investorId));

  const readyDocs = docs.filter((d) => d.status === 'ready' && d.extractedText);

  // Build corpus from all documents
  const corpus = readyDocs.map((d) => d.extractedText).join('\n\n---\n\n');

  // Extract profile
  const profile = extractInvestorProfile(corpus);

  // Update investor with extracted profile
  await db
    .update(investors)
    .set({
      thesisSummary: profile.thesisSummary,
      checkSizeMin: profile.checkSizeMin,
      checkSizeMax: profile.checkSizeMax,
      stages: profile.stages.length > 0 ? profile.stages : null,
      geographies: profile.geographies.length > 0 ? profile.geographies : null,
      focusSectors: profile.focusSectors.length > 0 ? profile.focusSectors : null,
      excludedSectors: profile.excludedSectors.length > 0 ? profile.excludedSectors : null,
      updatedAt: new Date(),
    })
    .where(eq(investors.id, ctx.investorId));

  await updateStepState(ctx.runId, {
    currentStep: 'extract-profile',
  });
}

/**
 * Step: Generate embeddings for sections and investor
 */
async function stepGenerateEmbeddings(ctx: WorkflowContext): Promise<void> {
  // Get all sections
  const sections = await db
    .select()
    .from(investorSections)
    .where(eq(investorSections.investorId, ctx.investorId));

  // Embed all section contents
  const sectionTexts = sections.map((s) => s.content);
  const sectionEmbeddings = await embedTexts(sectionTexts);

  // Update sections with embeddings
  for (let i = 0; i < sections.length; i++) {
    await db
      .update(investorSections)
      .set({
        embedding: sectionEmbeddings[i].embedding,
        embeddingModel: sectionEmbeddings[i].model,
      })
      .where(eq(investorSections.id, sections[i].id));
  }

  // Get updated investor for thesis/sectors embeddings
  const [investor] = await db
    .select()
    .from(investors)
    .where(eq(investors.id, ctx.investorId));

  if (investor) {
    const embeddingModel = getEmbeddingModel();
    const embeddingDim = getEmbeddingDimensions();

    // Embed thesis summary
    let thesisEmbedding: number[] | null = null;
    if (investor.thesisSummary) {
      const result = await embedText(investor.thesisSummary);
      thesisEmbedding = result.embedding;
    }

    // Embed sectors as a combined string
    let sectorsEmbedding: number[] | null = null;
    const sectorsText = [
      ...(investor.focusSectors || []),
      ...(investor.stages || []),
      ...(investor.geographies || []),
    ].join(', ');

    if (sectorsText) {
      const result = await embedText(sectorsText);
      sectorsEmbedding = result.embedding;
    }

    // Update investor with embeddings
    await db
      .update(investors)
      .set({
        thesisEmbedding,
        sectorsEmbedding,
        embeddingModel,
        embeddingDim,
        updatedAt: new Date(),
      })
      .where(eq(investors.id, ctx.investorId));
  }

  await updateStepState(ctx.runId, {
    currentStep: 'generate-embeddings',
  });
}

/**
 * Step: Compute coverage and finalize
 */
async function stepFinalize(ctx: WorkflowContext): Promise<void> {
  // Get updated investor
  const [investor] = await db
    .select()
    .from(investors)
    .where(eq(investors.id, ctx.investorId));

  if (!investor) {
    throw new Error('Investor not found');
  }

  // Compute coverage
  const { score, missingFields } = computeCoverage(investor);
  const status = needsReview(score) ? 'needs_review' : 'ready';

  // Update investor with coverage info and final status
  await db
    .update(investors)
    .set({
      coverageScore: score,
      missingFields: missingFields.length > 0 ? missingFields : null,
      status,
      updatedAt: new Date(),
    })
    .where(eq(investors.id, ctx.investorId));

  // Update ingestion run as succeeded
  await db
    .update(ingestionRuns)
    .set({
      status: 'succeeded',
      finishedAt: new Date(),
      stepState: {
        currentStep: 'finalize',
        completedSteps: [
          'load',
          'mark-documents-processing',
          'extract-urls',
          'extract-pdfs',
          'mark-documents-ready',
          'chunk-documents',
          'extract-profile',
          'generate-embeddings',
          'finalize',
        ],
        lastUpdated: new Date().toISOString(),
      },
    })
    .where(eq(ingestionRuns.id, ctx.runId));
}

/**
 * The workflow steps in order
 */
const workflowSteps: WorkflowStep[] = [
  { name: 'load', execute: stepLoad },
  { name: 'mark-documents-processing', execute: stepMarkDocumentsProcessing },
  { name: 'extract-urls', execute: stepExtractUrls },
  { name: 'extract-pdfs', execute: stepExtractPdfs },
  { name: 'mark-documents-ready', execute: stepMarkDocumentsReady },
  { name: 'chunk-documents', execute: stepChunkDocuments },
  { name: 'extract-profile', execute: stepExtractProfile },
  { name: 'generate-embeddings', execute: stepGenerateEmbeddings },
  { name: 'finalize', execute: stepFinalize },
];

/**
 * Run the investor ingestion workflow
 */
export async function runIngestInvestorWorkflow(
  ctx: WorkflowContext
): Promise<void> {
  const completedSteps: string[] = [];

  try {
    for (const step of workflowSteps) {
      await updateStepState(ctx.runId, {
        currentStep: step.name,
        completedSteps,
      });

      await step.execute(ctx);
      completedSteps.push(step.name);
    }
  } catch (error) {
    // Mark the run as failed
    await db
      .update(ingestionRuns)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stepState: {
          currentStep: 'failed',
          completedSteps,
          lastUpdated: new Date().toISOString(),
        },
      })
      .where(eq(ingestionRuns.id, ctx.runId));

    // Mark investor as failed
    await db
      .update(investors)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(investors.id, ctx.investorId));

    throw error;
  }
}
