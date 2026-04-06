import type { ValuationComparable } from "@ypi/domain";

export interface ScoredComparable extends ValuationComparable {
  numericScore: number;
  explanation: string;
  usedNearestYearFallback: boolean;
}

export function scoreComparable(
  comparable: ValuationComparable
): ScoredComparable {
  return {
    ...comparable,
    numericScore: 0,
    explanation:
      "Scoring is intentionally stubbed until the normalized and valuation-ready layers are in place.",
    usedNearestYearFallback: false
  };
}
