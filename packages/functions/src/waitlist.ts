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
 * @param data - The request data containing email and optional company name
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
      const company = request.data.company || null; // Optional company name

      // Validate email format
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Get Firestore instance for the 'sansa-ml' database
      const db = getFirestore('sansa-ml');

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
          const docData: {
            email: string;
            timestamp: string;
            company?: string | null;
          } = {
            email,
            timestamp: new Date().toISOString(),
          };

          // Only include company if provided
          if (company !== null) {
            docData.company = company;
          }

          await docRef.set(docData, { merge: true });
          createdNew = true;
        } else {
          console.log(
            `Waitlist entry for ${email} already exists. Skipping create.`
          );
        }
      } catch (error: unknown) {
        const firestoreError = error as FirestoreError;
        console.error('Firestore set operation failed:', firestoreError);

        throw new Error(
          'Service is currently unavailable. Please try again later.'
        );
      }

      // Send confirmation email only if we created a new entry
      if (createdNew) {
        try {
          await sendWaitlistConfirmationEmail(email, company);
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

      // Return generic service unavailable message for all errors
      return {
        success: false,
        message: 'Service is currently unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE',
      };
    }
  }
);

/**
 * Sends a notification email to admins when someone joins the waitlist
 * @param signupEmail - The email address of the person who signed up
 * @param company - The optional company name of the person who signed up
 * @returns Promise indicating success or failure of sending the email
 */
async function sendWaitlistConfirmationEmail(
  signupEmail: string,
  company: string | null
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
      to: ['joshuabenjaminm@gmail.com', 'ag4text@gmail.com'],
      from: 'noreply@sansaml.com', // Use your verified sender
      subject: 'New Waitlist Signup',
      text: `New waitlist sign up: ${signupEmail}${company ? ` (${company})` : ''}`,
      html: `
        <div style="text-align: left; font-family: Arial, sans-serif;">
          <p style="margin: 0;">New waitlist sign up: <strong>${signupEmail}</strong>${company ? ` from <strong>${company}</strong>` : ''}</p>
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
    console.log(`Waitlist notification email sent for signup: ${signupEmail}`);
  } catch (error: unknown) {
    const sendgridError = error as { code?: number; message?: string };
    console.error('Error sending waitlist notification email:', sendgridError);

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
