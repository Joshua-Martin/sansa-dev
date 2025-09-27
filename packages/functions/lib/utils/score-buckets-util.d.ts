/**
 * Simple distribution tracking - just score buckets and total count.
 * Matches the interface used in x-bot-score.ts
 */
export interface SimpleDistribution {
  totalUsers: number;
  buckets: Record<string, number>;
}
/**
 * Fetches both score-distribution and score-seed documents from Firestore,
 * updates score-distribution with new score data, and returns a combined
 * SimpleDistribution for client consumption.
 *
 * @param newScore - The new score to add to score-distribution (optional)
 * @returns Combined SimpleDistribution from both documents
 */
export declare function getCombinedScoreDistribution(
  newScore?: number
): Promise<SimpleDistribution>;
/**
 * Fetches only the combined score distribution without updating anything.
 * Useful for read-only operations.
 *
 * @returns Combined SimpleDistribution from both documents
 */
export declare function getCombinedScoreDistributionReadOnly(): Promise<SimpleDistribution>;
//# sourceMappingURL=score-buckets-util.d.ts.map
