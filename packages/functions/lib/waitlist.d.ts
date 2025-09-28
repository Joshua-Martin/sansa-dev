/**
 * Function to add an email to the waitlist
 * @param data - The request data containing email
 * @returns Promise with success message or error
 */
export declare const addToWaitlist: import('firebase-functions/https').CallableFunction<
  any,
  Promise<
    | {
        success: boolean;
        message: string;
        error?: undefined;
      }
    | {
        success: boolean;
        message: string;
        error: string;
      }
  >,
  unknown
>;
//# sourceMappingURL=waitlist.d.ts.map
