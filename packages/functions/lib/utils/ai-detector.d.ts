/**
 * AI/Bot detection utility for analyzing tweet patterns and content.
 *
 * Analyzes various linguistic and formatting patterns that may indicate
 * automated or AI-generated content on social media platforms.
 */
import { type AiDetectorWeights } from './ai-detector-weights.js';
/**
 * Interface for AI detection analysis results.
 */
export interface AiDetectionResult {
  /** Overall AI/bot likelihood score (0-99, always below 100) */
  score: number;
  /** Breakdown of individual pattern scores for debugging */
  patterns: {
    specialChars: number;
    suspiciousPhrases: number;
    markdownFormatting: number;
    bulletPoints: number;
    emojiToWordRatio: number;
    uppercaseRatio: number;
    repeatedChars: number;
    vocabularyDiversity: number;
    hashtags: number;
    everyYouPatterns: number;
    questionPhrases: number;
    isntItsPatterns: number;
  };
}
/**
 * Interface for AI detection results with individual tweet analysis.
 */
export interface AiDetectionWithTweets extends AiDetectionResult {
  /** Individual results for each tweet */
  individualResults: Array<{
    index: number;
    score: number;
    patterns: AiDetectionResult['patterns'];
  }>;
  /** Information about the highest scoring tweet */
  highestScoringTweet?: {
    index: number;
    score: number;
    text: string;
  };
}
/**
 * Computes an AI/bot likelihood score based on tweet content analysis.
 *
 * Analyzes each tweet individually and then aggregates the results for a more
 * accurate representation of mixed AI/human content.
 *
 * @param texts - Array of normalized tweet texts to analyze.
 * @param weights - Optional custom weights configuration. Uses DEFAULT_WEIGHTS if not provided.
 * @returns AI detection analysis with score, pattern breakdown, and individual tweet results.
 */
export declare function getAiScore(
  texts: string[],
  weights?: AiDetectorWeights
): AiDetectionWithTweets;
//# sourceMappingURL=ai-detector.d.ts.map
