import Enquirer from 'enquirer'

import type {ConfirmationOptions, PromptOptions, SelectionOptions} from './prompts.types.js'
import type {Result} from './result.js'

/**
 * Prompts the user for text input
 *
 * @param options Configuration for the text prompt
 * @returns Result containing the user's input or an error
 *
 * @example
 * ```typescript
 * const result = await promptForText({
 *   message: 'What is your name?',
 *   initial: 'Guest',
 *   validate: (value) => value.length > 0 || 'Name is required'
 * });
 *
 * if (result.success) {
 *   console.log(`Hello, ${result.data}!`);
 * }
 * ```
 */
export async function promptForText(
  options: PromptOptions<string>,
): Promise<Result<string, Error>> {
  try {
    if (options.skip) {
      return {data: options.initial ?? '', success: true}
    }

    const response = await Enquirer.prompt<{value: string}>({
      initial: options.initial,
      message: options.message,
      name: 'value',
      type: 'input',
      validate: options.validate,
    })

    return {data: response.value, success: true}
  } catch (error) {
    return {
      error: new Error(
        error instanceof Error ? error.message : 'Prompt cancelled',
      ),
      success: false,
    }
  }
}

/**
 * Prompts the user for password input (masked)
 *
 * @param options Configuration for the password prompt
 * @returns Result containing the user's password or an error
 *
 * @example
 * ```typescript
 * const result = await promptForPassword({
 *   message: 'Enter your password:',
 *   validate: (value) => value.length >= 8 || 'Password must be at least 8 characters'
 * });
 *
 * if (result.success) {
 *   // Use password securely
 * }
 * ```
 */
export async function promptForPassword(
  options: PromptOptions<string>,
): Promise<Result<string, Error>> {
  try {
    if (options.skip) {
      return {data: options.initial ?? '', success: true}
    }

    const response = await Enquirer.prompt<{value: string}>({
      initial: options.initial,
      message: options.message,
      name: 'value',
      type: 'password',
      validate: options.validate,
    })

    return {data: response.value, success: true}
  } catch (error) {
    return {
      error: new Error(
        error instanceof Error ? error.message : 'Prompt cancelled',
      ),
      success: false,
    }
  }
}

/**
 * Prompts the user to select a single option from a list
 *
 * @template T The type of the choices
 * @param options Configuration for the selection prompt
 * @returns Result containing the selected value or an error
 *
 * @example
 * ```typescript
 * const result = await promptForSelection({
 *   message: 'Choose your environment:',
 *   choices: ['development', 'staging', 'production'],
 *   initial: 'development'
 * });
 *
 * if (result.success) {
 *   console.log(`Deploying to ${result.data}`);
 * }
 * ```
 */
export async function promptForSelection<T>(
  options: SelectionOptions<T>,
): Promise<Result<T, Error>> {
  try {
    if (options.skip) {
      return {
        data: options.initial ?? options.choices[0],
        success: true,
      }
    }

    const response = await Enquirer.prompt<{value: T}>({
      choices: options.choices.map(String),
      initial: options.initial === undefined ?
        0 :
        options.choices.indexOf(options.initial),
      message: options.message,
      name: 'value',
      type: 'select',
    })

    // Find the original choice object by matching the string value
    const selectedIndex = options.choices.findIndex(
      (choice) => String(choice) === String(response.value),
    )
    const selectedValue =
      selectedIndex === -1 ? response.value : options.choices[selectedIndex]

    return {data: selectedValue, success: true}
  } catch (error) {
    return {
      error: new Error(
        error instanceof Error ? error.message : 'Prompt cancelled',
      ),
      success: false,
    }
  }
}

/**
 * Prompts the user to select multiple options from a list
 *
 * @template T The type of the choices
 * @param options Configuration for the multi-selection prompt
 * @returns Result containing an array of selected values or an error
 *
 * @example
 * ```typescript
 * const result = await promptForMultipleSelections({
 *   message: 'Select features to enable:',
 *   choices: ['logging', 'monitoring', 'analytics', 'caching'],
 *   initial: ['logging', 'monitoring']
 * });
 *
 * if (result.success) {
 *   console.log(`Enabled: ${result.data.join(', ')}`);
 * }
 * ```
 */
export async function promptForMultipleSelections<T>(
  options: Omit<SelectionOptions<T>, 'initial'> & {initial?: T[]},
): Promise<Result<T[], Error>> {
  try {
    if (options.skip) {
      return {
        data: options.initial ?? [],
        success: true,
      }
    }

    const response = await Enquirer.prompt<{value: string[]}>({
      choices: options.choices.map(String),
      initial: options.initial?.map((item) =>
        options.choices.indexOf(item),
      ),
      message: options.message,
      name: 'value',
      type: 'multiselect',
    })

    // Map selected string values back to original choice objects
    const selectedValues = response.value
      .map((selectedStr) => {
        const index = options.choices.findIndex(
          (choice) => String(choice) === selectedStr,
        )
        return index === -1 ? null : options.choices[index]
      })
      .filter((v): v is T => v !== null)

    return {data: selectedValues, success: true}
  } catch (error) {
    return {
      error: new Error(
        error instanceof Error ? error.message : 'Prompt cancelled',
      ),
      success: false,
    }
  }
}

/**
 * Prompts the user for confirmation (yes/no)
 *
 * @param options Configuration for the confirmation prompt
 * @returns Result containing true (yes) or false (no), or an error if cancelled
 *
 * @example
 * ```typescript
 * const result = await promptForConfirmation({
 *   message: 'Are you sure you want to delete this VM?',
 *   initial: false
 * });
 *
 * if (result.success && result.data) {
 *   // User confirmed - proceed with deletion
 *   console.log('Deleting VM...');
 * } else if (result.success) {
 *   // User declined
 *   console.log('Operation cancelled');
 * } else {
 *   // Prompt was cancelled (Ctrl+C)
 *   console.error('Prompt cancelled:', result.error.message);
 * }
 * ```
 */
export async function promptForConfirmation(
  options: ConfirmationOptions,
): Promise<Result<boolean, Error>> {
  try {
    if (options.skip) {
      return {data: options.initial ?? false, success: true}
    }

    const response = await Enquirer.prompt<{value: boolean}>({
      initial: options.initial,
      message: options.message,
      name: 'value',
      type: 'confirm',
    })

    return {data: response.value, success: true}
  } catch (error) {
    return {
      error: new Error(
        error instanceof Error ? error.message : 'Prompt cancelled',
      ),
      success: false,
    }
  }
}
