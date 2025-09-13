/**
 * Product overview types for managing product/service descriptions
 *
 * Simplified types for basic product overview management in the MVP
 */

/**
 * Product overview entity containing the textual description
 */
export interface ProductOverview {
  /** Unique identifier for the product overview */
  id: string;

  /** ID of the context this overview belongs to */
  workspaceId: string;

  /** ID of the user who owns this overview */
  userId: string;

  /** Optional detailed content */
  content: string;

  /** Timestamp when the overview was created */
  createdAt: string;

  /** Timestamp when the overview was last updated */
  updatedAt: string;
}

/**
 * Request payload for creating a product overview
 */
export interface CreateProductOverviewRequest {
  /** ID of the context this overview belongs to */
  workspaceId: string;

  /** Content of the product overview */
  content: string;
}

/**
 * Request payload for updating a product overview
 */
export interface UpdateProductOverviewRequest {
  /** Updated content of the product overview */
  content: string;
}
