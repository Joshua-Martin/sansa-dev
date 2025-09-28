'use client';

import { useForm } from 'react-hook-form';
import { useAddToWaitlist } from '../../hooks/useAddToWaitlist';

/**
 * Waitlist Form Component
 *
 * Email collection form for the waitlist using React Hook Form for validation.
 * Includes work email input field and submit button.
 */
export function WaitlistForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ email: string }>();

  const { addToWaitlist, isLoading } = useAddToWaitlist();

  const onSubmit = async (data: { email: string }) => {
    try {
      await addToWaitlist(data.email);
      reset();
    } catch (error) {
      // Error handling is done by the hook - no need to handle here
      console.error('Failed to add to waitlist:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white mb-2"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-colors"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mono-text w-full px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Joining...' : 'Join waitlist'}
        </button>
      </div>
    </form>
  );
}
