import { SimpleDistribution } from './utils/score-buckets-util.js';
interface ProcessedTweet {
  text: string;
  score: number;
  likes?: number;
  reposts?: number;
  replies?: number;
}
/**
 * Result of the AI check.
 * Returned to the client.
 */
interface AiCheckResult {
  name: string;
  profileImageUrl: string;
  verified: boolean;
  joinDate: string;
  score: number;
  percentile: number;
  distribution: SimpleDistribution;
  mostSuspiciousTweet?: ProcessedTweet;
}
/**
 * Computes a simple "bot score" for an X (Twitter) account using recent tweets.
 *
 * Callable HTTPS function.
 *
 * Input data:
 * - handle: string — the user's X account handle (without the leading @)
 *
 * Behavior:
 * 1. Uses Apify Twitter scraper to fetch user profile and recent tweets.
 * 2. Fetches up to 10 tweets from the user timeline using web scraping.
 * 3. Normalizes tweets and computes comprehensive AI/bot detection metrics:
 *    - Legacy rules: em dash count, emoji count, word count
 *    - Advanced AI patterns: special characters, suspicious phrases, markdown formatting
 *    - Linguistic analysis: vocabulary diversity, uppercase ratio, repeated characters
 * 4. Combines multiple scoring heuristics with the original rules:
 *    - Legacy: emDashCount >= 2 → high score; emoji thresholds
 *    - AI detection: bullet points, startup phrases, markdown formatting
 *    - Final score is always capped below 100%
 *
 * Environment variables:
 * - APIFY_TOKEN: API token for Apify client
 */
export declare const xBotScore: import('firebase-functions/https').CallableFunction<
  any,
  Promise<AiCheckResult>,
  unknown
>;
export {};
//# sourceMappingURL=x-bot-score.d.ts.map
