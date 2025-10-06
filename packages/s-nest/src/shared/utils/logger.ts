/**
 * Logger utility for AI Engine components
 * Provides consistent logging format across the application
 */
export class Logger {
  private readonly context: string;

  /**
   * Creates a new logger instance
   * @param context - The context for this logger (usually class or module name)
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Formats a log message with context
   * @param message - The message to log
   * @returns Formatted message with context
   */
  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }

  /**
   * Logs an info message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  public info(message: string, data?: unknown): void {
    console.log(this.formatMessage(message), data !== undefined ? data : '');
  }

  /**
   * Logs a debug message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  public debug(message: string, data?: unknown): void {
    console.debug(this.formatMessage(message), data !== undefined ? data : '');
  }

  /**
   * Logs a warning message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  public warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage(message), data !== undefined ? data : '');
  }

  /**
   * Logs an error message
   * @param message - The message to log
   * @param error - Optional error to include
   */
  public error(message: string, error?: unknown): void {
    console.error(
      this.formatMessage(message),
      error !== undefined ? error : '',
    );
  }
}
