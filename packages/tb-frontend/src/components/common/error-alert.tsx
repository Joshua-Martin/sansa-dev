import { AlertCircle } from 'lucide-react';
import * as React from 'react';

/**
 * ErrorAlertProps
 *
 * Props for the ErrorAlert component.
 */
export interface ErrorAlertProps {
  /**
   * The error message to display in the alert.
   */
  message: string;
  /**
   * Optional: Additional className for custom styling.
   */
  className?: string;
}

/**
 * ErrorAlert
 *
 * Displays an error alert with a rounded red border and a red error icon.
 * Shows the text 'Error: {message}'.
 *
 * @param {ErrorAlertProps} props - The props for the component.
 * @returns {JSX.Element} The rendered ErrorAlert component.
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  className,
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-center w-full rounded-lg border border-red-500 bg-red-50 text-red-700 p-4 gap-3 ${
        className ?? ''
      }`}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
      <span className="font-medium">Error:</span>
      <span className="break-words">{message}</span>
    </div>
  );
};
