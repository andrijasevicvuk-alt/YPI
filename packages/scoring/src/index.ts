import type {
  ComparableCandidate,
  ComparableRetrievalTier,
  ComparableScoreBreakdown,
  ComparableScoringCandidate,
  ComparableScoringInput,
  ComparableScoringMode,
  ComparableScoringResult,
  ValuationRangeResult
} from "@ypi/domain";

export const FUTURE_SCORING_DIMENSIONS = [
  "retrieval_tier",
  "variant_match",
  "year_distance",
  "geography_closeness",
  "recency_staleness",
  "ownership_status",
  "source_reliability",
  "data_quality",
  "duplicate_cluster_signal",
  "price_outlier_handling"
] as const;

const NOT_SCORED_NOTE =
  "Step 5E defines the scoring contract only; no score, confidence, rank, valuation range, or price estimate is calculated.";

function createEmptyBreakdown(): ComparableScoreBreakdown {
  return {
    overallScore: null,
    confidenceScore: null,
    retrievalTierScore: null,
    variantScore: null,
    yearScore: null,
    geographyScore: null,
    recencyScore: null,
    ownershipScore: null,
    sourceReliabilityScore: null,
    dataQualityScore: null,
    duplicatePenalty: null,
    outlierPenalty: null
  };
}

function createEmptyValuationRange(
  candidateCount: number
): ValuationRangeResult {
  return {
    status: "not_calculated",
    minPriceEur: null,
    maxPriceEur: null,
    estimatedPriceEur: null,
    confidence: null,
    explanationNotes: [
      "Valuation range calculation is intentionally out of scope for Step 5E.",
      `Retrieved candidate count preserved for future valuation: ${candidateCount}.`
    ]
  };
}

function inferCurrentRetrievalTier(
  candidate: ComparableCandidate
): ComparableRetrievalTier {
  if (candidate.builderId !== null && candidate.modelId !== null) {
    return "same_builder_same_model";
  }

  return "not_evaluated";
}

function toScoringCandidate(
  candidate: ComparableCandidate
): ComparableScoringCandidate {
  return {
    candidate,
    retrievalTier: inferCurrentRetrievalTier(candidate),
    variantMatch: candidate.variantMatch,
    yearDelta: candidate.yearDelta,
    yearMatchBucket: candidate.yearMatchBucket,
    geographyBucket: candidate.geographyBucket,
    recencyBucket: candidate.recencyBucket,
    sourceReliabilityScore: candidate.sourceReliabilityScore,
    dataQualityScore: candidate.dataQualityScore,
    duplicateSignal: candidate.duplicateSignal,
    scoringStatus: "not_scored",
    score: null,
    confidence: null,
    rank: null,
    breakdown: createEmptyBreakdown(),
    explanation: {
      status: "not_scored",
      notes: [
        NOT_SCORED_NOTE,
        "Candidate order is preserved from retrieval and is not ranking."
      ],
      futureDimensions: [...FUTURE_SCORING_DIMENSIONS]
    }
  };
}

export function scoreComparableCandidates(
  input: ComparableScoringInput
): ComparableScoringResult {
  const candidates = input.candidates.map(toScoringCandidate);
  const scoringMode: ComparableScoringMode =
    input.scoringMode ?? "contract_only";

  return {
    target: input.target,
    candidates,
    returnedCount: input.returnedCount,
    filtersApplied: input.filtersApplied,
    retrievalNotes: input.retrievalNotes,
    scoringMode,
    scoringStatus: "not_scored",
    valuationRange: createEmptyValuationRange(candidates.length),
    explanationNotes: [
      NOT_SCORED_NOTE,
      "Future scoring must distinguish exact-model, related-model, cross-builder/spec-similar, and broad-market fallback candidates.",
      "Geography and recency signals are preserved for future scoring but are not weighted here."
    ]
  };
}
