/**
 * TypeORM patch for crypto.randomUUID() issue
 *
 * This file patches the TypeORM utils to ensure the crypto module is properly imported
 * before being used. This resolves startup errors in Node.js environments where
 * crypto is not automatically available as a global.
 */
import * as crypto from 'crypto';

// Attach crypto to global if not present
// This ensures TypeORM can access it without explicit imports
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = crypto;
}
