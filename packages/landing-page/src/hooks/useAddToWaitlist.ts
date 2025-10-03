import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/**
 * Hook for adding an email to the waitlist using Firebase Functions
 *
 * @returns Object containing addToWaitlist function, loading state, and error state
 */
export function useAddToWaitlist() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Adds an email to the waitlist by calling the Firebase Cloud Function
   *
   * @param email - The email address to add to the waitlist
   * @returns Promise that resolves when the operation completes
   */
  const addToWaitlist = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const addToWaitlistFunction = httpsCallable(functions, 'addToWaitlist');
      const result = await addToWaitlistFunction({ email });

      const data = result.data as {
        success: boolean;
        message: string;
        error?: string;
      };

      if (!data.success) {
        throw new Error(data.message || 'Failed to add email to waitlist');
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addToWaitlist,
    isLoading,
    error,
  };
}



