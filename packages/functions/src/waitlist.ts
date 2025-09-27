import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { validateEmail } from './utils/email-validator.js';
// Import SendGrid with default import for proper TypeScript support
import sendgrid from '@sendgrid/mail';

// Define Firestore error codes for better error handling
enum FirestoreErrorCode {
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  UNAUTHENTICATED = 16,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
}

// Interface for Firestore errors which extend Error with a code property
interface FirestoreError extends Error {
  code?: FirestoreErrorCode;
  details?: string;
}

/**
 * Function to add an email to the waitlist
 * @param data - The request data containing email
 * @returns Promise with success message or error
 */
export const addToWaitlist = onCall(
  {
    cors: true,
    maxInstances: 1,
    minInstances: 0,
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      // Validate request data
      if (!request.data || !request.data.email) {
        throw new Error('Email is required');
      }

      const email = request.data.email;

      // Validate email format
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Get Firestore instance for the 'aviator' database
      const db = getFirestore('aviator');

      // Reference to waitlist collection
      const waitlistRef = db.collection('waitlist');
      let createdNew = false; // Tracks if we just created a new waitlist entry

      try {
        // Use the email as the document ID so duplicates are naturally avoided.
        const docRef = waitlistRef.doc(email);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          // Firestore doc ID is already the email string; we store it again for redundancy and
          // use `merge: true` so repeated calls won’t overwrite future schema additions.
          await docRef.set(
            {
              email,
              timestamp: new Date().toISOString(),
            },
            { merge: true }
          );
          createdNew = true;
        } else {
          console.log(
            `Waitlist entry for ${email} already exists. Skipping create.`
          );
        }
      } catch (error: unknown) {
        const firestoreError = error as FirestoreError;
        console.error('Firestore set operation failed:', firestoreError);

        if (firestoreError.code === FirestoreErrorCode.NOT_FOUND) {
          throw new Error(
            'Unable to access waitlist collection. Database path may not exist.'
          );
        } else if (
          firestoreError.code === FirestoreErrorCode.PERMISSION_DENIED
        ) {
          throw new Error('Permission denied when accessing the database.');
        } else {
          throw new Error(
            `Database error: ${firestoreError.message || 'Unknown database error'}`
          );
        }
      }

      // Send confirmation email only if we created a new entry
      if (createdNew) {
        try {
          await sendWaitlistConfirmationEmail(email);
        } catch (emailError) {
          // Log the error but don't fail the whole operation
          console.error(
            'Failed to send confirmation email, but entry was added to waitlist:',
            emailError
          );
          // Continue execution without throwing
        }
      }

      return {
        success: true,
        message: 'Email added to waitlist successfully',
      };
    } catch (error: unknown) {
      const firestoreError = error as FirestoreError;
      console.error('Error adding to waitlist:', firestoreError);

      // Enhanced error handling with more specific error messages
      if (firestoreError.code === FirestoreErrorCode.NOT_FOUND) {
        return {
          success: false,
          message:
            'Unable to access waitlist database. Please contact support.',
          error: 'DATABASE_NOT_FOUND',
        };
      } else if (firestoreError.code === FirestoreErrorCode.PERMISSION_DENIED) {
        return {
          success: false,
          message:
            'Permission denied when accessing the database. Please contact support.',
          error: 'PERMISSION_DENIED',
        };
      } else if (firestoreError.code === FirestoreErrorCode.UNAVAILABLE) {
        return {
          success: false,
          message:
            'Database service is currently unavailable. Please try again later.',
          error: 'SERVICE_UNAVAILABLE',
        };
      } else {
        return {
          success: false,
          message:
            firestoreError instanceof Error
              ? firestoreError.message
              : 'Failed to add email to waitlist',
          error: 'UNKNOWN_ERROR',
        };
      }
    }
  }
);

/**
 * Sends a confirmation email to users who join the waitlist
 * @param recipientEmail - The email address of the recipient
 * @returns Promise indicating success or failure of sending the email
 */
async function sendWaitlistConfirmationEmail(
  recipientEmail: string
): Promise<void> {
  try {
    // Check for SendGrid API key presence
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SendGrid API key is not configured. Skipping email send.');
      return;
    }

    // Initialize SendGrid with API key
    sendgrid.setApiKey(apiKey);

    // Create the email message with named parameters
    const msg = {
      to: recipientEmail,
      from: 'joshua@aviator.cx', // Use your verified sender
      subject: 'Aviator Waitlist Confirmation',
      text: `Aviator is coming soon\n\nThank you for joining our waitlist. We'll keep you updated on our progress.\n\nFrom the Founders of Aviator,\nJoshua & Alex`,
      html: `
        <div style="text-align: left; font-family: Arial, sans-serif;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 16px 0;">Aviator is coming soon</h1>
          <p style="margin: 0 0 16px 0;">Thank you for joining our waitlist. We'll keep you updated on our progress.</p>
          <p style="margin: 0;">From the Founders of Aviator,<br/>Joshua & Alex</p>
        </div>
      `,
    };

    // Send the email with timeout handling
    const emailPromise = sendgrid.send(msg);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Email send operation timed out')),
        10000
      ); // 10 second timeout
    });

    await Promise.race([emailPromise, timeoutPromise]);
    console.log(`Waitlist confirmation email sent to: ${recipientEmail}`);
  } catch (error: unknown) {
    const sendgridError = error as { code?: number; message?: string };
    console.error('Error sending waitlist confirmation email:', sendgridError);

    // Log specific error types for better debugging
    if (sendgridError.code === 401 || sendgridError.code === 403) {
      console.error('SendGrid authentication error. Check API key validity.');
    } else if (sendgridError.code === 429) {
      console.error('SendGrid rate limit exceeded. Too many requests.');
    } else if (sendgridError.message === 'Email send operation timed out') {
      console.error('SendGrid email send operation timed out.');
    }

    // Don't throw the error here to prevent breaking the main function flow
    // Just log it since email sending is a secondary operation
  }
}
