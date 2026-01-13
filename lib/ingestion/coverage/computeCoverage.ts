import type { Investor } from '@/lib/database';

export interface CoverageResult {
  score: number;
  missingFields: string[];
}

/**
 * Fields that contribute to the coverage score
 */
const COVERAGE_FIELDS: { field: keyof Investor; label: string; weight: number }[] = [
  { field: 'name', label: 'Name', weight: 5 },
  { field: 'firm', label: 'Firm', weight: 5 },
  { field: 'website', label: 'Website', weight: 5 },
  { field: 'thesisSummary', label: 'Thesis Summary', weight: 20 },
  { field: 'checkSizeMin', label: 'Check Size Min', weight: 10 },
  { field: 'checkSizeMax', label: 'Check Size Max', weight: 10 },
  { field: 'stages', label: 'Stages', weight: 15 },
  { field: 'geographies', label: 'Geographies', weight: 10 },
  { field: 'focusSectors', label: 'Focus Sectors', weight: 15 },
  { field: 'excludedSectors', label: 'Excluded Sectors', weight: 5 },
];

/**
 * Check if a field has a value
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return Boolean(value);
}

/**
 * Compute coverage score and missing fields for an investor profile
 *
 * @param investor - The investor profile to evaluate
 * @returns Coverage result with score (0-100) and list of missing fields
 */
export function computeCoverage(investor: Partial<Investor>): CoverageResult {
  const missingFields: string[] = [];
  let totalWeight = 0;
  let achievedWeight = 0;

  for (const { field, label, weight } of COVERAGE_FIELDS) {
    totalWeight += weight;

    if (hasValue(investor[field])) {
      achievedWeight += weight;
    } else {
      missingFields.push(label);
    }
  }

  // Calculate percentage score
  const score = Math.round((achievedWeight / totalWeight) * 100);

  return {
    score,
    missingFields,
  };
}

/**
 * Determine if an investor profile needs review based on coverage
 *
 * @param score - Coverage score (0-100)
 * @returns true if the profile needs manual review
 */
export function needsReview(score: number): boolean {
  // Profiles with less than 70% coverage need review
  return score < 70;
}
