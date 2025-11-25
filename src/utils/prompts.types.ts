/**
 * Base configuration options for prompts
 * @template T The type of value expected from the prompt
 */
export interface PromptOptions<T> {
  /**
   * Default/initial value for the prompt
   */
  initial?: T;

  /**
   * The message to display to the user
   */
  message: string;

  /**
   * Whether to skip this prompt
   */
  skip?: boolean;

  /**
   * Validation function that returns true if valid, or an error message string if invalid
   */
  validate?: (value: T) => boolean | string;
}

/**
 * Configuration options for selection-based prompts (single or multiple)
 * @template T The type of choices available
 */
export interface SelectionOptions<T> extends PromptOptions<T> {
  /**
   * Array of choices to present to the user
   */
  choices: T[];
}

/**
 * Configuration options for confirmation prompts (yes/no)
 * Validation is not applicable for boolean confirmations
 */
export type ConfirmationOptions = Omit<PromptOptions<boolean>, 'validate'>
