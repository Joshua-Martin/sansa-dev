/**
 * AI Detector Scoring Weights Configuration
 *
 * This file contains all the weights and scoring parameters used by the AI detector.
 * Adjust these values to tune the detector's sensitivity to different patterns.
 */
/**
 * Configuration interface for AI detector weights and scoring parameters.
 */
export interface AiDetectorWeights {
  /** Pattern-specific scoring weights (applied as multipliers to pattern scores) */
  patternWeights: {
    /** Weight for AI phrase compounding score (applied directly, not as multiplier) */
    aiPhraseCompounding: number;
    /** Weight for markdown formatting patterns */
    markdownFormatting: number;
    /** Weight for special character usage */
    specialChars: number;
    /** Weight for emoji-to-word ratio - CRITICAL for modern AI detection */
    emojiToWordRatio: number;
    /** Weight for uppercase text ratio */
    uppercaseRatio: number;
    /** Weight for repeated character patterns */
    repeatedChars: number;
    /** Weight for vocabulary diversity patterns */
    vocabularyDiversity: number;
    /** Weight for hashtag usage (applied directly, not as multiplier) */
    hashtags: number;
  };
  /** Base scoring values for individual patterns */
  baseScores: {
    /** Points per suspicious phrase detected */
    suspiciousPhrase: number;
    /** Points per question phrase detected (2-word questions like "The survivors?") */
    questionPhrase: number;
    /** Points per "Every X you" pattern detected */
    everyYouPattern: number;
    /** Points per unicode bullet point (•) detected */
    unicodeBullet: number;
    /** Points per "It isn't X. It's Y." pattern detected */
    isntItsPattern: number;
    /** Points per hashtag detected */
    hashtag: number;
    /** Points per special character detected */
    specialChar: number;
    /** Max points for dash bullets (keyboard bullets like "- item") */
    dashBulletMax: number;
    /** Points per dash bullet detected */
    dashBullet: number;
  };
  /** Em dash scoring (highest priority AI indicator) */
  emDashScoring: {
    /** Points added for single em dash */
    singleEmDash: number;
    /** Score for 2+ em dashes (instant AI detection) */
    multipleEmDashes: number;
  };
  /** Emoji-based scoring thresholds and multipliers */
  emojiScoring: {
    /** Instant high score threshold (total emoji count) */
    instantHighThreshold: number;
    /** Instant high score value */
    instantHighScore: number;
    /** High emoji threshold (total emoji count) */
    highThreshold: number;
    /** Score multiplier for high emoji usage */
    highMultiplier: number;
    /** Emojis per tweet threshold for significant boost */
    perTweetThreshold: number;
    /** Multiplier for emoji per tweet boost calculation */
    perTweetMultiplier: number;
    /** Maximum boost from emoji per tweet calculation */
    perTweetMaxBoost: number;
  };
  /** Emoji-to-word ratio scoring thresholds */
  emojiRatioThresholds: {
    /** Very high emoji density per tweet */
    veryHigh: {
      threshold: number;
      score: number;
    };
    /** High emoji density per tweet */
    high: {
      threshold: number;
      score: number;
    };
    /** Moderate-high emoji density per tweet */
    moderateHigh: {
      threshold: number;
      score: number;
    };
    /** Moderate emoji density per tweet */
    moderate: {
      threshold: number;
      score: number;
    };
    /** Low-moderate emoji density per tweet */
    lowModerate: {
      threshold: number;
      score: number;
    };
    /** Traditional ratio-based scoring thresholds */
    traditional: {
      high: {
        threshold: number;
        score: number;
      };
      medium: {
        threshold: number;
        score: number;
      };
      low: {
        threshold: number;
        score: number;
      };
      /** Fallback multiplier for very low ratios */
      fallbackMultiplier: number;
    };
  };
  /** Uppercase ratio scoring thresholds */
  uppercaseThresholds: {
    /** Excessive uppercase threshold */
    excessive: {
      threshold: number;
      score: number;
    };
    /** High uppercase threshold */
    high: {
      threshold: number;
      score: number;
    };
    /** Fallback multiplier for moderate uppercase usage */
    fallbackMultiplier: number;
  };
  /** Human-like pattern detection (negative scoring) */
  humanLikeScoring: {
    /** Points subtracted per human-like spelling error detected */
    errorReduction: number;
    /** Points subtracted per informal contraction detected */
    contractionReduction: number;
    /** Points subtracted per keyboard typo pattern detected */
    typoReduction: number;
    /** Points subtracted per personal/casual pattern detected */
    personalReduction: number;
    /** Points subtracted per conversational pattern detected */
    conversationalReduction: number;
    /** Points subtracted per uncertainty/casual expression detected */
    uncertaintyReduction: number;
    /** Points subtracted per swear word/casual expression detected */
    swearReduction: number;
    /** Points subtracted per lowercase sentence start detected */
    lowercaseStartReduction: number;
    /** Points subtracted per inconsistent punctuation pattern detected */
    punctuationReduction: number;
    /** Maximum points that can be subtracted for human-like patterns */
    maxReduction: number;
  };
  /** General scoring limits */
  limits: {
    /** Maximum possible AI score (always below 100) */
    maxScore: number;
    /** Minimum possible AI score */
    minScore: number;
  };
}
/**
 * Default AI detector weights optimized for modern AI detection.
 *
 * Key changes from original:
 * - Increased emoji weight significantly (modern AI loves emojis)
 * - Maintained em dash as top indicator
 * - Balanced other patterns for comprehensive detection
 */
export declare const DEFAULT_WEIGHTS: AiDetectorWeights;
//# sourceMappingURL=ai-detector-weights.d.ts.map
